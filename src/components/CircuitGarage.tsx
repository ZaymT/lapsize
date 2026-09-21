import React, { useState } from 'react';
import type { Track, TrackSeries } from '../types/game';
import { TRACKS } from '../data/tracks';
import { X, Search, Info } from 'lucide-react';

interface CircuitGarageProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CircuitGarage: React.FC<CircuitGarageProps> = ({ isOpen, onClose }) => {
  const [selectedSeries, setSelectedSeries] = useState<TrackSeries | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<Track>(TRACKS[0]);

  if (!isOpen) return null;

  const filteredTracks = TRACKS.filter(t => {
    const matchesSeries = selectedSeries === 'all' || t.series === selectedSeries;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.country.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeries && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-carbon-950/85 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center animate-in fade-in duration-200 font-mono">
      <div className="w-full max-w-5xl h-[85vh] bg-carbon-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-carbon-950/50">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F0FF]" />
            <span className="font-bold text-base text-slate-100 uppercase tracking-wider">
              CIRCUIT TELEMETRY ARCHIVE ({TRACKS.length} CIRCUITS)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-carbon-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-carbon-900/90">
          {/* Series Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-carbon-950 rounded-xl border border-slate-800 text-xs">
            {(['all', 'f1', 'nascar', 'indycar'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSelectedSeries(s)}
                className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider transition-all ${
                  selectedSeries === s
                    ? 'bg-cyan-400 text-carbon-950 shadow-cyan-glow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s === 'all' ? 'ALL TRACKS' : s.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search circuit, city..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-carbon-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Content Body: Split View (List on Left, Interactive Telemetry on Right) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Track List (Left Pane) */}
          <div className="w-full md:w-80 border-r border-slate-800/80 overflow-y-auto p-2 space-y-1 bg-carbon-950/40">
            {filteredTracks.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTrack(t)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                  selectedTrack.id === t.id
                    ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 shadow-sm'
                    : 'bg-carbon-900/60 border-slate-800 text-slate-300 hover:bg-carbon-800'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-slate-100">{t.name}</span>
                  <span className="text-[10px] text-slate-500">{t.city}, {t.country}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.series}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{(t.officialLapLengthMeters / 1000).toFixed(2)} km</span>
                </div>
              </button>
            ))}
          </div>

          {/* Track Telemetry Details (Right Pane) */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 bg-carbon-900">
            {/* Header with Series Badge */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block mb-1">
                  {selectedTrack.series.toUpperCase()} • {selectedTrack.trackType.replace('_', ' ').toUpperCase()}
                </span>
                <h3 className="text-2xl font-extrabold text-slate-100">{selectedTrack.name}</h3>
                <span className="text-xs text-slate-400">
                  {selectedTrack.city}, {selectedTrack.country} • Opened {selectedTrack.yearOpened}
                </span>
              </div>

              <div className="px-3 py-1.5 bg-carbon-950 border border-slate-800 rounded-xl text-right">
                <span className="text-[10px] text-slate-500 block">OFFICIAL LAP</span>
                <span className="text-sm font-bold text-cyan-400">
                  {(selectedTrack.officialLapLengthMeters / 1000).toFixed(3)} km
                </span>
                <span className="text-[10px] text-slate-400 block">({selectedTrack.officialLapLengthMiles.toFixed(3)} mi)</span>
              </div>
            </div>

            {/* Vector Blueprint Preview */}
            <div className="relative h-64 w-full bg-carbon-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-4">
              <div className="absolute inset-0 telemetry-grid opacity-30 pointer-events-none" />
              <svg
                viewBox={selectedTrack.viewBox}
                className="w-full h-full max-h-56 filter drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]"
              >
                <path
                  d={selectedTrack.svgPath}
                  fill="rgba(0, 240, 255, 0.05)"
                  stroke="#00F0FF"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Dimensions & Geographic Footprint */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-carbon-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Bounding Width</span>
                <span className="text-base font-bold text-slate-200 mt-1 block">
                  {selectedTrack.boundingWidthMeters} m
                </span>
                <span className="text-[10px] text-slate-500">{Math.round(selectedTrack.boundingWidthMeters * 3.28084)} ft</span>
              </div>

              <div className="p-3 bg-carbon-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Bounding Height</span>
                <span className="text-base font-bold text-slate-200 mt-1 block">
                  {selectedTrack.boundingHeightMeters} m
                </span>
                <span className="text-[10px] text-slate-500">{Math.round(selectedTrack.boundingHeightMeters * 3.28084)} ft</span>
              </div>

              <div className="p-3 bg-carbon-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Enclosed Land</span>
                <span className="text-base font-bold text-emerald-400 mt-1 block">
                  {selectedTrack.areaAcres} acres
                </span>
                <span className="text-[10px] text-slate-500">{selectedTrack.areaHectares} hectares</span>
              </div>

              <div className="p-3 bg-carbon-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Total Corners</span>
                <span className="text-base font-bold text-amber-400 mt-1 block">
                  {selectedTrack.turns} Turns
                </span>
                <span className="text-[10px] text-slate-500">Official count</span>
              </div>
            </div>

            {/* Scale Trivia */}
            <div className="p-4 bg-carbon-950 rounded-xl border border-slate-800 flex flex-col gap-2">
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                Scale & History Trivia
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {selectedTrack.trivia.map((t, idx) => (
                  <li key={idx} className="leading-relaxed">{t}</li>
                ))}
              </ul>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
