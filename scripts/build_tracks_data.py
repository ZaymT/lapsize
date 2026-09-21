import os
import json
import math
import re
import urllib.request
import xml.etree.ElementTree as ET

print("Starting LapSize track data compilation...")

# --------------------------------------------------------------------------------
# SVG Path Parser
# --------------------------------------------------------------------------------
def parse_full_svg_path(d_str, num_curve_samples=6):
    tokens = re.findall(r'[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?', d_str)
    points = []
    curr_x, curr_y = 0.0, 0.0
    start_x, start_y = 0.0, 0.0
    i = 0
    cmd = ''
    while i < len(tokens):
        t = tokens[i]
        if t.isalpha():
            cmd = t
            i += 1
            if i >= len(tokens): break

        if cmd == 'M':
            curr_x, curr_y = float(tokens[i]), float(tokens[i+1])
            start_x, start_y = curr_x, curr_y
            points.append((curr_x, curr_y))
            i += 2
            cmd = 'L'
        elif cmd == 'm':
            curr_x += float(tokens[i])
            curr_y += float(tokens[i+1])
            start_x, start_y = curr_x, curr_y
            points.append((curr_x, curr_y))
            i += 2
            cmd = 'l'
        elif cmd == 'L':
            curr_x, curr_y = float(tokens[i]), float(tokens[i+1])
            points.append((curr_x, curr_y))
            i += 2
        elif cmd == 'l':
            curr_x += float(tokens[i])
            curr_y += float(tokens[i+1])
            points.append((curr_x, curr_y))
            i += 2
        elif cmd == 'H':
            curr_x = float(tokens[i])
            points.append((curr_x, curr_y))
            i += 1
        elif cmd == 'h':
            curr_x += float(tokens[i])
            points.append((curr_x, curr_y))
            i += 1
        elif cmd == 'V':
            curr_y = float(tokens[i])
            points.append((curr_x, curr_y))
            i += 1
        elif cmd == 'v':
            curr_y += float(tokens[i])
            points.append((curr_x, curr_y))
            i += 1
        elif cmd == 'C':
            x1, y1 = float(tokens[i]), float(tokens[i+1])
            x2, y2 = float(tokens[i+2]), float(tokens[i+3])
            x, y = float(tokens[i+4]), float(tokens[i+5])
            p0, p1, p2, p3 = (curr_x, curr_y), (x1, y1), (x2, y2), (x, y)
            for s in range(1, num_curve_samples + 1):
                u = s / float(num_curve_samples)
                px = (1-u)**3*p0[0] + 3*(1-u)**2*u*p1[0] + 3*(1-u)*u**2*p2[0] + u**3*p3[0]
                py = (1-u)**3*p0[1] + 3*(1-u)**2*u*p1[1] + 3*(1-u)*u**2*p2[1] + u**3*p3[1]
                points.append((px, py))
            curr_x, curr_y = x, y
            i += 6
        elif cmd == 'c':
            x1, y1 = curr_x + float(tokens[i]), curr_y + float(tokens[i+1])
            x2, y2 = curr_x + float(tokens[i+2]), curr_y + float(tokens[i+3])
            x, y = curr_x + float(tokens[i+4]), curr_y + float(tokens[i+5])
            p0, p1, p2, p3 = (curr_x, curr_y), (x1, y1), (x2, y2), (x, y)
            for s in range(1, num_curve_samples + 1):
                u = s / float(num_curve_samples)
                px = (1-u)**3*p0[0] + 3*(1-u)**2*u*p1[0] + 3*(1-u)*u**2*p2[0] + u**3*p3[0]
                py = (1-u)**3*p0[1] + 3*(1-u)**2*u*p1[1] + 3*(1-u)*u**2*p2[1] + u**3*p3[1]
                points.append((px, py))
            curr_x, curr_y = x, y
            i += 6
        elif cmd in ('Z', 'z'):
            curr_x, curr_y = start_x, start_y
            points.append((curr_x, curr_y))
            i += 1
        else:
            i += 1
    return points

# --------------------------------------------------------------------------------
# Point Processor & Metric Scaler
# --------------------------------------------------------------------------------
def process_points(raw_pts, target_lap_len_m):
    cleaned = [raw_pts[0]]
    for p in raw_pts[1:]:
        if math.hypot(p[0]-cleaned[-1][0], p[1]-cleaned[-1][1]) > 0.05:
            cleaned.append(p)
            
    raw_len = sum(math.hypot(cleaned[i][0]-cleaned[i-1][0], cleaned[i][1]-cleaned[i-1][1]) for i in range(len(cleaned)))
    scale = target_lap_len_m / raw_len if raw_len > 0 else 1.0
    
    scaled = [(p[0] * scale, p[1] * scale) for p in cleaned]
    
    xs = [p[0] for p in scaled]
    ys = [p[1] for p in scaled]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    cx = (min_x + max_x) / 2.0
    cy = (min_y + max_y) / 2.0
    
    final_pts = [(round(p[0] - cx, 1), round(p[1] - cy, 1)) for p in scaled]
    
    fxs = [p[0] for p in final_pts]
    fys = [p[1] for p in final_pts]
    width_m = round(max(fxs) - min(fxs), 1)
    height_m = round(max(fys) - min(fys), 1)
    
    area_m2 = 0.5 * abs(sum(final_pts[i][0]*final_pts[(i+1)%len(final_pts)][1] - final_pts[(i+1)%len(final_pts)][0]*final_pts[i][1] for i in range(len(final_pts))))
    area_hectares = round(area_m2 / 10000.0, 1)
    area_acres = round(area_m2 / 4046.8564224, 1)
    
    step = max(1, len(final_pts) // 180)
    sampled = final_pts[::step]
    if sampled[-1] != sampled[0]:
        sampled.append(sampled[0])
        
    path_d = "M " + " L ".join(f"{p[0]} {p[1]}" for p in sampled) + " Z"
    pad = max(width_m, height_m) * 0.1
    view_box = f"{-width_m/2 - pad:.1f} {-height_m/2 - pad:.1f} {width_m + 2*pad:.1f} {height_m + 2*pad:.1f}"
    
    return {
        "svgPath": path_d,
        "viewBox": view_box,
        "boundingWidthMeters": width_m,
        "boundingHeightMeters": height_m,
        "areaHectares": area_hectares,
        "areaAcres": area_acres,
        "centerlinePoints": [{"x": p[0], "y": p[1]} for p in sampled]
    }

def fetch_tumftm(fname, lap_len_m):
    url = f"https://raw.githubusercontent.com/TUMFTM/racetrack-database/master/tracks/{fname}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        lines = [l.strip() for l in resp.read().decode('utf-8').splitlines() if l.strip() and not l.startswith('#')]
    pts = [list(map(float, l.split(',')[:2])) for l in lines]
    pts_svg = [(p[0], -p[1]) for p in pts]
    return process_points(pts_svg, lap_len_m)

def fetch_bacinger(fname, lap_len_m):
    url = f"https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/{fname}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    coords = data['features'][0]['geometry']['coordinates']
    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    mean_lat = sum(lats) / len(lats)
    mean_lon = sum(lons) / len(lons)
    R = 6371000.0
    rad = math.pi / 180.0
    cos_lat = math.cos(mean_lat * rad)
    pts_m = [((c[0] - mean_lon) * rad * R * cos_lat, -(c[1] - mean_lat) * rad * R) for c in coords]
    return process_points(pts_m, lap_len_m)

def parse_local_svg(fname, path_id, lap_len_m):
    tree = ET.parse(fname)
    target_d = None
    if path_id == 'longest':
        max_len = 0
        for el in tree.getroot().iter():
            d = el.get('d', '')
            if len(d) > max_len:
                max_len = len(d)
                target_d = d
    else:
        for el in tree.getroot().iter():
            if el.get('id') == path_id:
                target_d = el.get('d')
                break
    if not target_d:
        raise ValueError(f"Path {path_id} not found in {fname}")
    pts = parse_full_svg_path(target_d)
    return process_points(pts, lap_len_m)

def generate_trioval(length_m, back_len_m, turn_radius_m, dogleg_offset_m, num_pts=200):
    pts = []
    n_seg = num_pts // 4
    for i in range(n_seg):
        t = i / float(n_seg)
        x = -back_len_m / 2.0 + t * back_len_m
        y = -turn_radius_m
        pts.append((x, y))
    for i in range(n_seg):
        t = i / float(n_seg)
        angle = -math.pi/2.0 + t * math.pi
        x = back_len_m / 2.0 + turn_radius_m * math.cos(angle)
        y = turn_radius_m * math.sin(angle)
        pts.append((x, y))
    for i in range(n_seg):
        t = i / float(n_seg)
        p0 = (back_len_m / 2.0, turn_radius_m)
        p1 = (0.0, turn_radius_m + dogleg_offset_m * 1.5)
        p2 = (-back_len_m / 2.0, turn_radius_m)
        u = t
        x = (1-u)**2 * p0[0] + 2*(1-u)*u * p1[0] + u**2 * p2[0]
        y = (1-u)**2 * p0[1] + 2*(1-u)*u * p1[1] + u**2 * p2[1]
        pts.append((x, y))
    for i in range(n_seg):
        t = i / float(n_seg)
        angle = math.pi/2.0 + t * math.pi
        x = -back_len_m / 2.0 + turn_radius_m * math.cos(angle)
        y = turn_radius_m * math.sin(angle)
        pts.append((x, y))
    return process_points(pts, length_m)

def generate_quadoval(length_m, back_len_m, turn_radius_m, dogleg_depth_m, num_pts=200):
    pts = []
    n_seg = num_pts // 4
    for i in range(n_seg):
        t = i / float(n_seg)
        x = -back_len_m / 2.0 + t * back_len_m
        y = -turn_radius_m
        pts.append((x, y))
    for i in range(n_seg):
        t = i / float(n_seg)
        angle = -math.pi/2.0 + t * math.pi
        x = back_len_m / 2.0 + turn_radius_m * math.cos(angle)
        y = turn_radius_m * math.sin(angle)
        pts.append((x, y))
    for i in range(n_seg):
        t = i / float(n_seg)
        p0 = (back_len_m / 2.0, turn_radius_m)
        p1 = (back_len_m * 0.25, turn_radius_m + dogleg_depth_m)
        p2 = (-back_len_m * 0.25, turn_radius_m + dogleg_depth_m)
        p3 = (-back_len_m / 2.0, turn_radius_m)
        u = t
        x = (1-u)**3*p0[0] + 3*(1-u)**2*u*p1[0] + 3*(1-u)*u**2*p2[0] + u**3*p3[0]
        y = (1-u)**3*p0[1] + 3*(1-u)**2*u*p1[1] + 3*(1-u)*u**2*p2[1] + u**3*p3[1]
        pts.append((x, y))
    for i in range(n_seg):
        t = i / float(n_seg)
        angle = math.pi/2.0 + t * math.pi
        x = -back_len_m / 2.0 + turn_radius_m * math.cos(angle)
        y = turn_radius_m * math.sin(angle)
        pts.append((x, y))
    return process_points(pts, length_m)

def generate_d_oval(length_m, back_len_m, turn_radius_m, front_bulge_m, num_pts=200):
    pts = []
    n_seg = num_pts // 4
    for i in range(n_seg):
        t = i / float(n_seg)
        x = -back_len_m / 2.0 + t * back_len_m
        y = -turn_radius_m
        pts.append((x, y))
    for i in range(n_seg):
        t = i / float(n_seg)
        angle = -math.pi/2.0 + t * math.pi
        x = back_len_m / 2.0 + turn_radius_m * math.cos(angle)
        y = turn_radius_m * math.sin(angle)
        pts.append((x, y))
    for i in range(n_seg):
        t = i / float(n_seg)
        p0 = (back_len_m / 2.0, turn_radius_m)
        p1 = (0.0, turn_radius_m + front_bulge_m)
        p2 = (-back_len_m / 2.0, turn_radius_m)
        u = t
        x = (1-u)**2 * p0[0] + 2*(1-u)*u * p1[0] + u**2 * p2[0]
        y = (1-u)**2 * p0[1] + 2*(1-u)*u * p1[1] + u**2 * p2[1]
        pts.append((x, y))
    for i in range(n_seg):
        t = i / float(n_seg)
        angle = math.pi/2.0 + t * math.pi
        x = -back_len_m / 2.0 + turn_radius_m * math.cos(angle)
        y = turn_radius_m * math.sin(angle)
        pts.append((x, y))
    return process_points(pts, length_m)

def generate_egg_oval(length_m, L, r1, r2, num_pts=240):
    alpha = math.asin((r1 - r2) / L)
    p1_top = (L/2.0 - r1*math.sin(alpha), r1*math.cos(alpha))
    p2_top = (-L/2.0 - r2*math.sin(alpha), r2*math.cos(alpha))
    p2_bot = (-L/2.0 - r2*math.sin(alpha), -r2*math.cos(alpha))
    p1_bot = (L/2.0 - r1*math.sin(alpha), -r1*math.cos(alpha))
    pts = []
    n = num_pts // 4
    for i in range(n):
        t = i / float(n)
        pts.append((p1_top[0] + t * (p2_top[0] - p1_top[0]), p1_top[1] + t * (p2_top[1] - p1_top[1])))
    angle_start = math.pi/2.0 + alpha
    angle_end = 3.0 * math.pi / 2.0 - alpha
    for i in range(n):
        t = i / float(n)
        theta = angle_start + t * (angle_end - angle_start)
        pts.append((-L/2.0 + r2 * math.cos(theta), r2 * math.sin(theta)))
    for i in range(n):
        t = i / float(n)
        pts.append((p2_bot[0] + t * (p1_bot[0] - p2_bot[0]), p2_bot[1] + t * (p1_bot[1] - p2_bot[1])))
    angle_start_wide = -math.pi/2.0 - alpha
    angle_end_wide = math.pi/2.0 + alpha
    for i in range(n):
        t = i / float(n)
        theta = angle_start_wide + t * (angle_end_wide - angle_start_wide)
        pts.append((L/2.0 + r1 * math.cos(theta), r1 * math.sin(theta)))
    return process_points(pts, length_m)

def fetch_midohio(lap_len_m):
    way_ids = [444205375, 444205376, 444205377, 444205378, 1315957511, 1315957513, 1315957514, 1315957515]
    nodes = {}
    ways = []
    for wid in way_ids:
        url = f'https://api.openstreetmap.org/api/0.6/way/{wid}/full.json'
        req = urllib.request.Request(url, headers={'User-Agent': 'LapsizeGameProject/1.0'})
        with urllib.request.urlopen(req) as resp:
            d = json.loads(resp.read().decode('utf-8'))
            for el in d['elements']:
                if el['type'] == 'node':
                    nodes[el['id']] = (el['lon'], el['lat'])
                elif el['type'] == 'way':
                    ways.append(el['nodes'])

    ordered = list(ways[0])
    rem = ways[1:]
    while rem:
        found = False
        for i, w in enumerate(rem):
            if w[0] == ordered[-1]:
                ordered.extend(w[1:])
                rem.pop(i)
                found = True
                break
            elif w[-1] == ordered[-1]:
                ordered.extend(list(reversed(w))[1:])
                rem.pop(i)
                found = True
                break
            elif w[-1] == ordered[0]:
                ordered = w[:-1] + ordered
                rem.pop(i)
                found = True
                break
            elif w[0] == ordered[0]:
                ordered = list(reversed(w))[:-1] + ordered
                rem.pop(i)
                found = True
                break
        if not found:
            break

    coords = [nodes[nid] for nid in ordered]
    mean_lat = sum(c[1] for c in coords)/len(coords)
    mean_lon = sum(c[0] for c in coords)/len(coords)
    R = 6371000.0
    rad = math.pi/180.0
    cos_lat = math.cos(mean_lat*rad)
    pts = [((c[0]-mean_lon)*rad*R*cos_lat, -(c[1]-mean_lat)*rad*R) for c in coords]
    return process_points(pts, lap_len_m)


# --------------------------------------------------------------------------------
# TRACK DEFINITIONS & DATA PIPELINE
# --------------------------------------------------------------------------------
raw_tracks = [
    # FORMULA 1
    {
        "id": "monaco",
        "name": "Circuit de Monaco",
        "shortName": "Monaco",
        "series": "f1",
        "trackType": "street",
        "country": "Monaco",
        "countryCode": "MC",
        "city": "Monte Carlo",
        "turns": 19,
        "officialLapLengthMeters": 3337,
        "officialLapLengthMiles": 2.074,
        "yearOpened": 1929,
        "source": ("bacinger", "mc-1929.geojson"),
        "trivia": [
            "The entire Circuit de Monaco comfortably fits inside the infield of Daytona International Speedway 4.2 times.",
            "Monaco's tight Fairmont Hairpin is navigated at just 45 km/h (28 mph), requiring custom steering racks with extra lock.",
            "At 3.337 km, Monaco is the shortest track on the Formula 1 calendar."
        ]
    },
    {
        "id": "spa",
        "name": "Circuit de Spa-Francorchamps",
        "shortName": "Spa",
        "series": "f1",
        "trackType": "road",
        "country": "Belgium",
        "countryCode": "BE",
        "city": "Stavelot",
        "turns": 19,
        "officialLapLengthMeters": 7004,
        "officialLapLengthMiles": 4.352,
        "yearOpened": 1921,
        "source": ("tumftm", "Spa.csv"),
        "trivia": [
            "Spa's legendary Kemmel Straight alone (approx. 1.8 km) is more than double the entire lap length of Martinsville Speedway.",
            "Spa is the longest circuit on the modern Formula 1 calendar, spanning over 7 kilometers of Ardennes forest.",
            "The elevation rise from Eau Rouge to the crest of Raidillon is over 102 meters (335 feet) — equivalent to a 35-story building."
        ]
    },
    {
        "id": "silverstone",
        "name": "Silverstone Circuit",
        "shortName": "Silverstone",
        "series": "f1",
        "trackType": "road",
        "country": "United Kingdom",
        "countryCode": "GB",
        "city": "Silverstone",
        "turns": 18,
        "officialLapLengthMeters": 5891,
        "officialLapLengthMiles": 3.661,
        "yearOpened": 1948,
        "source": ("tumftm", "Silverstone.csv"),
        "trivia": [
            "Built on a former WWII Royal Air Force bomber station, Silverstone's grounds enclose over 550 acres of land.",
            "F1 cars carry over 290 km/h (180 mph) through the legendary Maggotts-Becketts-Chapel complex, experiencing lateral forces exceeding 5G.",
            "Silverstone hosted the very first Formula 1 World Championship Grand Prix on May 13, 1950."
        ]
    },
    {
        "id": "monza",
        "name": "Autodromo Nazionale Monza",
        "shortName": "Monza",
        "series": "f1",
        "trackType": "road",
        "country": "Italy",
        "countryCode": "IT",
        "city": "Monza",
        "turns": 11,
        "officialLapLengthMeters": 5793,
        "officialLapLengthMiles": 3.600,
        "yearOpened": 1922,
        "source": ("tumftm", "Monza.csv"),
        "trivia": [
            "Known as the 'Temple of Speed', F1 drivers spend nearly 80% of each lap at full throttle.",
            "Monza's footprint is long and slender, stretching over 2.1 kilometers from the Variante del Rettifilo chicane to the Curva Parabolica.",
            "Lewis Hamilton recorded the fastest F1 qualifying lap in history here in 2020 at an average speed of 264.362 km/h (164.267 mph)."
        ]
    },
    {
        "id": "cota",
        "name": "Circuit of the Americas",
        "shortName": "COTA",
        "series": "f1",
        "trackType": "road",
        "country": "United States",
        "countryCode": "US",
        "city": "Austin, TX",
        "turns": 20,
        "officialLapLengthMeters": 5513,
        "officialLapLengthMiles": 3.426,
        "yearOpened": 2012,
        "source": ("tumftm", "Austin.csv"),
        "trivia": [
            "COTA's Turn 1 features a dramatic 41-meter (133-foot) climb into a blind uphill hairpin inspired by European circuits.",
            "The facility encompasses 1,500 acres in Travis County, Texas, designed by Hermann Tilke and Tavo Hellmund.",
            "COTA is one of the only venues in the world that regularly hosts Formula 1, NASCAR Cup Series, and MotoGP on the same layout."
        ]
    },
    {
        "id": "suzuka",
        "name": "Suzuka International Racing Course",
        "shortName": "Suzuka",
        "series": "f1",
        "trackType": "road",
        "country": "Japan",
        "countryCode": "JP",
        "city": "Suzuka",
        "turns": 18,
        "officialLapLengthMeters": 5807,
        "officialLapLengthMiles": 3.608,
        "yearOpened": 1962,
        "source": ("tumftm", "Suzuka.csv"),
        "trivia": [
            "Suzuka is one of the only circuits in international motorsport built in a figure-eight layout with an overpass bridge.",
            "The backstraight overpass crosses directly over the Degner Curve straightaway.",
            "Designed originally as a Honda test facility in 1962 by Dutch track designer John Hugenholtz."
        ]
    },
    {
        "id": "redbullring",
        "name": "Red Bull Ring",
        "shortName": "Red Bull Ring",
        "series": "f1",
        "trackType": "road",
        "country": "Austria",
        "countryCode": "AT",
        "city": "Spielberg",
        "turns": 10,
        "officialLapLengthMeters": 4318,
        "officialLapLengthMiles": 2.683,
        "yearOpened": 1969,
        "source": ("tumftm", "Spielberg.csv"),
        "trivia": [
            "With only 10 corners, the Red Bull Ring produces the shortest lap time on the F1 calendar (under 63 seconds).",
            "The circuit has an elevation change of 65 meters (213 feet) set amidst the Styrian Alps.",
            "Modern Red Bull Ring is an evolution of the fearsome, ultra-fast Österreichring."
        ]
    },
    {
        "id": "interlagos",
        "name": "Autódromo José Carlos Pace",
        "shortName": "Interlagos",
        "series": "f1",
        "trackType": "road",
        "country": "Brazil",
        "countryCode": "BR",
        "city": "São Paulo",
        "turns": 15,
        "officialLapLengthMeters": 4309,
        "officialLapLengthMiles": 2.677,
        "yearOpened": 1940,
        "source": ("tumftm", "SaoPaulo.csv"),
        "trivia": [
            "Interlagos runs anti-clockwise and sits in a natural bowl between two subterranean lakes in São Paulo.",
            "Spectators in the main grandstand can see roughly 70% of the entire circuit from a single vantage point.",
            "The final sector forms a continuous high-speed acceleration curve climbing uphill towards the start-finish line."
        ]
    },
    {
        "id": "montreal",
        "name": "Circuit Gilles Villeneuve",
        "shortName": "Montreal",
        "series": "f1",
        "trackType": "street",
        "country": "Canada",
        "countryCode": "CA",
        "city": "Montreal",
        "turns": 14,
        "officialLapLengthMeters": 4361,
        "officialLapLengthMiles": 2.710,
        "yearOpened": 1978,
        "source": ("tumftm", "Montreal.csv"),
        "trivia": [
            "Located on Île Notre-Dame, a man-made island built in the Saint Lawrence River for the 1967 World's Fair (Expo 67).",
            "The final chicane famously features the 'Wall of Champions', which claimed Damon Hill, Michael Schumacher, and Jacques Villeneuve in 1999.",
            "Because it is situated on an island strip, the circuit is extremely narrow and elongated (under 400m wide)."
        ]
    },
    {
        "id": "zandvoort",
        "name": "Circuit Zandvoort",
        "shortName": "Zandvoort",
        "series": "f1",
        "trackType": "road",
        "country": "Netherlands",
        "countryCode": "NL",
        "city": "Zandvoort",
        "turns": 14,
        "officialLapLengthMeters": 4259,
        "officialLapLengthMiles": 2.646,
        "yearOpened": 1948,
        "source": ("tumftm", "Zandvoort.csv"),
        "trivia": [
            "Carved into the coastal sand dunes of the North Sea, featuring the extreme 18° banked Arie Luyendyk curve.",
            "Zandvoort's 18° banking is more than double the banking of Indianapolis Motor Speedway's turns (9°).",
            "Seaside gusts constantly shift beach sand across the asphalt, creating unpredictable grip conditions."
        ]
    },
    {
        "id": "nuerburgring",
        "name": "Nürburgring GP-Strecke",
        "shortName": "Nürburgring GP",
        "series": "f1",
        "trackType": "road",
        "country": "Germany",
        "countryCode": "DE",
        "city": "Nürburg",
        "turns": 16,
        "officialLapLengthMeters": 5148,
        "officialLapLengthMiles": 3.199,
        "yearOpened": 1984,
        "source": ("tumftm", "Nuerburgring.csv"),
        "trivia": [
            "Built adjacent to the historic 20.8 km Nordschleife ('The Green Hell') to modern Grand Prix safety standards.",
            "Features the tight Castrol S chicane and the uphill Michael Schumacher S curves.",
            "Perched at 600 meters altitude in the Eifel mountains, known for microclimates with sudden rain and fog."
        ]
    },

    # NASCAR
    {
        "id": "daytona",
        "name": "Daytona International Speedway",
        "shortName": "Daytona",
        "series": "nascar",
        "trackType": "tri_oval",
        "country": "United States",
        "countryCode": "US",
        "city": "Daytona Beach, FL",
        "turns": 4,
        "officialLapLengthMeters": 4023,
        "officialLapLengthMiles": 2.500,
        "yearOpened": 1959,
        "source": ("trioval", 4023.36, 914.4, 304.8, 65.0),
        "trivia": [
            "The infield includes Lake Lloyd, a 29-acre man-made lake created by excavating soil to build the 31-degree banking.",
            "The entire Circuit de Monaco layout comfortably fits inside the infield of Daytona International Speedway 4.2 times.",
            "Stock cars exceed 320 km/h (200 mph) in multi-car aerodynamic draft packs."
        ]
    },
    {
        "id": "talladega",
        "name": "Talladega Superspeedway",
        "shortName": "Talladega",
        "series": "nascar",
        "trackType": "tri_oval",
        "country": "United States",
        "countryCode": "US",
        "city": "Lincoln, AL",
        "turns": 4,
        "officialLapLengthMeters": 4281,
        "officialLapLengthMiles": 2.660,
        "yearOpened": 1969,
        "source": ("trioval", 4280.85, 1219.2, 335.28, 75.0),
        "trivia": [
            "The longest closed oval in NASCAR at 2.66 miles, with turns banked at an astonishing 33 degrees (equivalent to a 3-story building).",
            "The start-finish line is located past the dogleg towards Turn 1 to produce dramatic photo finishes.",
            "Bill Elliott set the all-time NASCAR qualifying record here in 1987 at 212.809 mph (342.483 km/h)."
        ]
    },
    {
        "id": "charlotte",
        "name": "Charlotte Motor Speedway",
        "shortName": "Charlotte",
        "series": "nascar",
        "trackType": "intermediate_oval",
        "country": "United States",
        "countryCode": "US",
        "city": "Concord, NC",
        "turns": 4,
        "officialLapLengthMeters": 2414,
        "officialLapLengthMiles": 1.500,
        "yearOpened": 1960,
        "source": ("quadoval", 2414.02, 414.5, 207.26, 45.0),
        "trivia": [
            "Features a unique quad-oval design with a double-dogleg frontstretch bending twice towards the grandstands.",
            "Host of the Coca-Cola 600, NASCAR's longest single-day endurance race (600 miles / 400 laps).",
            "The first modern superspeedway to host night racing under full permanent stadium lighting in 1992."
        ]
    },
    {
        "id": "darlington",
        "name": "Darlington Raceway",
        "shortName": "Darlington",
        "series": "nascar",
        "trackType": "intermediate_oval",
        "country": "United States",
        "countryCode": "US",
        "city": "Darlington, SC",
        "turns": 4,
        "officialLapLengthMeters": 2198,
        "officialLapLengthMiles": 1.366,
        "yearOpened": 1950,
        "source": ("egg_oval", 2198.0, 420.0, 250.0, 175.0),
        "trivia": [
            "Known as 'The Track Too Tough to Tame' and 'The Lady in Black' due to its asymmetric egg-shaped geometry.",
            "Builder Harold Brasington agreed not to disturb a neighbor's minnow pond, forcing Turns 3 and 4 to be built significantly narrower than Turns 1 and 2.",
            "Cars run millimeters from the outside wall, earning drivers the famous 'Darlington Stripe'."
        ]
    },
    {
        "id": "bristol",
        "name": "Bristol Motor Speedway",
        "shortName": "Bristol",
        "series": "nascar",
        "trackType": "short_oval",
        "country": "United States",
        "countryCode": "US",
        "city": "Bristol, TN",
        "turns": 4,
        "officialLapLengthMeters": 858,
        "officialLapLengthMiles": 0.533,
        "yearOpened": 1961,
        "source": ("svg", "raw_svgs/Bristol_Motor_Speedway_map.svg", "path408"),
        "trivia": [
            "Dubbed 'The Last Great Colosseum', completely enclosed by stadium seating for over 140,000 roaring spectators.",
            "A lap takes under 15 seconds, with banking up to 28 degrees, subjecting drivers to sustained G-forces similar to jet pilots.",
            "The entire track fits inside the infield of Indianapolis Motor Speedway more than 12 times!"
        ]
    },
    {
        "id": "martinsville",
        "name": "Martinsville Speedway",
        "shortName": "Martinsville",
        "series": "nascar",
        "trackType": "short_oval",
        "country": "United States",
        "countryCode": "US",
        "city": "Ridgeway, VA",
        "turns": 4,
        "officialLapLengthMeters": 847,
        "officialLapLengthMiles": 0.526,
        "yearOpened": 1947,
        "source": ("svg", "raw_svgs/Martinsville_track_map.svg", "path3722"),
        "trivia": [
            "The shortest track on the NASCAR Cup schedule at 0.526 miles, affectionately known as 'The Paperclip'.",
            "Two 800-foot flat straightaways connect tight 180-degree concrete corners banked at just 12 degrees.",
            "The race winner traditionally takes home a handcrafted grandfather clock built by Ridgeway Furniture."
        ]
    },
    {
        "id": "richmond",
        "name": "Richmond Raceway",
        "shortName": "Richmond",
        "series": "nascar",
        "trackType": "short_oval",
        "country": "United States",
        "countryCode": "US",
        "city": "Richmond, VA",
        "turns": 4,
        "officialLapLengthMeters": 1207,
        "officialLapLengthMiles": 0.750,
        "yearOpened": 1946,
        "source": ("d_oval", 1207.01, 393.0, 110.0, 32.0),
        "trivia": [
            "A 0.75-mile D-shaped asphalt oval known as 'America's Premier Short Track'.",
            "Blends short-track fender-to-fender racing with the high-speed aero characteristics of a superspeedway.",
            "The curved frontstretch allows continuous side-by-side passing throughout entire 400-lap events."
        ]
    },

    # INDYCAR
    {
        "id": "ims",
        "name": "Indianapolis Motor Speedway",
        "shortName": "IMS Oval",
        "series": "indycar",
        "trackType": "superspeedway",
        "country": "United States",
        "countryCode": "US",
        "city": "Speedway, IN",
        "turns": 4,
        "officialLapLengthMeters": 4023,
        "officialLapLengthMiles": 2.500,
        "yearOpened": 1909,
        "source": ("tumftm", "IMS.csv"),
        "trivia": [
            "The IMS infield covers 253 acres — large enough to fit Vatican City, the Roman Colosseum, the Taj Mahal, Yankee Stadium, and the Rose Bowl simultaneously!",
            "The entire grounds span over 1,000 acres, including a complete 18-hole championship golf course with 4 holes inside the infield.",
            "The start-finish line preserves a 3-foot strip of the original 3.2 million paving bricks from 1909: the Yard of Bricks."
        ]
    },
    {
        "id": "lagunaseca",
        "name": "WeatherTech Raceway Laguna Seca",
        "shortName": "Laguna Seca",
        "series": "indycar",
        "trackType": "road",
        "country": "United States",
        "countryCode": "US",
        "city": "Monterey, CA",
        "turns": 11,
        "officialLapLengthMeters": 3602,
        "officialLapLengthMiles": 2.238,
        "yearOpened": 1957,
        "source": ("svg", "raw_svgs/Laguna_Seca.svg", "path2538"),
        "trivia": [
            "Home to the world-famous 'Corkscrew' (Turns 8 and 8A) — a blind left-right plunge dropping 5.5 stories (59 feet) in just 450 feet of track length.",
            "Total track elevation change is 180 feet (55 meters) through dry California oak woodlands.",
            "Scene of Alex Zanardi's legendary 1996 'Pass' down the Corkscrew to claim the CART season finale."
        ]
    },
    {
        "id": "longbeach",
        "name": "Long Beach Street Circuit",
        "shortName": "Long Beach",
        "series": "indycar",
        "trackType": "street",
        "country": "United States",
        "countryCode": "US",
        "city": "Long Beach, CA",
        "turns": 11,
        "officialLapLengthMeters": 3167,
        "officialLapLengthMiles": 1.968,
        "yearOpened": 1975,
        "source": ("svg", "raw_svgs/Long_Beach_Street_Circuit_IndyCar.svg", "path5463"),
        "trivia": [
            "The longest-running major street race in North America, celebrating its 50th year in downtown Long Beach.",
            "Features the iconic fountain roundabout section in front of the Long Beach Performing Arts Center.",
            "The final turn is the tightest hairpin in American open-wheel racing, feeding onto the 3,800-foot Shoreline Drive."
        ]
    },
    {
        "id": "midohio",
        "name": "Mid-Ohio Sports Car Course",
        "shortName": "Mid-Ohio",
        "series": "indycar",
        "trackType": "road",
        "country": "United States",
        "countryCode": "US",
        "city": "Lexington, OH",
        "turns": 13,
        "officialLapLengthMeters": 3634,
        "officialLapLengthMiles": 2.258,
        "yearOpened": 1962,
        "source": ("midohio", 3634),
        "trivia": [
            "A challenging, undulating road course known for the elevated 'Keyhole' complex and the high-speed crests of 'Thunder Valley'.",
            "Features dramatic elevation changes over rolling Ohio hills, culminating in the sweeping Carousel corner.",
            "Voted one of the favorite driver circuits in North America for technical car control and commitment."
        ]
    }
]

processed_tracks = []

for item in raw_tracks:
    tid = item["id"]
    name = item["name"]
    lap_len = item["officialLapLengthMeters"]
    src_type = item["source"][0]
    print(f"Processing {name} (source: {src_type})...")
    
    if src_type == "tumftm":
        geo = fetch_tumftm(item["source"][1], lap_len)
    elif src_type == "bacinger":
        geo = fetch_bacinger(item["source"][1], lap_len)
    elif src_type == "svg":
        geo = parse_local_svg(item["source"][1], item["source"][2], lap_len)
    elif src_type == "trioval":
        _, length, back, radius, dogleg = item["source"]
        geo = generate_trioval(length, back, radius, dogleg)
    elif src_type == "quadoval":
        _, length, back, radius, dogleg = item["source"]
        geo = generate_quadoval(length, back, radius, dogleg)
    elif src_type == "d_oval":
        _, length, back, radius, bulge = item["source"]
        geo = generate_d_oval(length, back, radius, bulge)
    elif src_type == "egg_oval":
        _, length, L, r1, r2 = item["source"]
        geo = generate_egg_oval(length, L, r1, r2)
    elif src_type == "midohio":
        geo = fetch_midohio(lap_len)
    else:
        raise ValueError(f"Unknown source type: {src_type}")
        
    track_obj = {
        "id": item["id"],
        "name": item["name"],
        "shortName": item["shortName"],
        "series": item["series"],
        "trackType": item["trackType"],
        "country": item["country"],
        "countryCode": item["countryCode"],
        "city": item["city"],
        "turns": item["turns"],
        "officialLapLengthMeters": item["officialLapLengthMeters"],
        "officialLapLengthMiles": item["officialLapLengthMiles"],
        "boundingWidthMeters": geo["boundingWidthMeters"],
        "boundingHeightMeters": geo["boundingHeightMeters"],
        "areaHectares": geo["areaHectares"],
        "areaAcres": geo["areaAcres"],
        "svgPath": geo["svgPath"],
        "viewBox": geo["viewBox"],
        "centerlinePoints": geo["centerlinePoints"],
        "yearOpened": item["yearOpened"],
        "trivia": item["trivia"]
    }
    processed_tracks.append(track_obj)
    print(f"  -> Done! {geo['boundingWidthMeters']}m x {geo['boundingHeightMeters']}m, {geo['areaAcres']} acres")

# Output to src/data/tracks.ts
output_ts = """// ============================================================================
// LAPSIZE / GRIDSCALE - ACCURATE MOTORSPORT CIRCUIT DATABASE
// Real-world geographic survey centerlines, metric footprints, and trivia
// ============================================================================

import { Track, TrackSeries } from '../types/game';

export const TRACKS: Track[] = """ + json.dumps(processed_tracks, indent=2) + """;

export const TRACK_MAP: Record<string, Track> = TRACKS.reduce((acc, track) => {
  acc[track.id] = track;
  return acc;
}, {} as Record<string, Track>);

export function getTrackById(id: string): Track | undefined {
  return TRACK_MAP[id];
}

export function getTracksBySeries(series: TrackSeries): Track[] {
  return TRACKS.filter(t => t.series === series);
}

export function getRandomTrackPair(
  seriesFilter?: TrackSeries | 'open',
  seedRandom?: () => number
): [Track, Track] {
  const rng = seedRandom || Math.random;
  let pool = TRACKS;
  
  if (seriesFilter && seriesFilter !== 'open') {
    pool = TRACKS.filter(t => t.series === seriesFilter);
  }
  
  if (pool.length < 2) {
    pool = TRACKS; // fallback if pool is too small
  }
  
  const refIndex = Math.floor(rng() * pool.length);
  const refTrack = pool[refIndex];
  
  let targetPool = pool.filter(t => t.id !== refTrack.id);
  // For open class, guarantee high-contrast interesting matchups across series if possible
  if (seriesFilter === 'open' && rng() > 0.3) {
    const crossSeries = pool.filter(t => t.series !== refTrack.series);
    if (crossSeries.length > 0) {
      targetPool = crossSeries;
    }
  }
  
  const targetIndex = Math.floor(rng() * targetPool.length);
  const targetTrack = targetPool[targetIndex];
  
  return [refTrack, targetTrack];
}
"""

os.makedirs('src/data', exist_ok=True)
with open('src/data/tracks.ts', 'w') as f:
    f.write(output_ts)

print(f"Successfully generated src/data/tracks.ts with {len(processed_tracks)} tracks!")
