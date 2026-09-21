import React, { useState } from 'react';
import type { Track, TrackSeries } from '../types/game';
import { TRACKS } from '../data/tracks';
import { X, Search, Info, MapPin } from 'lucide-react';

interface CircuitGarageProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const CircuitGarage: React.FC<CircuitGarageProps> = ({ isOpen, onClose, isDark = true }) => {
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 flex justify-center items-start py-8 sm:py-12 animate-in fade-in duration-200 font-mono">
      <div className="w-full max-w-5xl h-[85vh] my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-cyan-400' : 'bg-blue-600'}`} />
            <span className="font-extrabold text-base uppercase tracking-wider">
              CIRCUIT TELEMETRY ARCHIVE ({TRACKS.length} CIRCUITS)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
          {/* Series Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            {(['all', 'f1', 'nascar', 'indycar'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSelectedSeries(s)}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all shadow-sm ${
                  selectedSeries === s
                    ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-cyan-400 border border-slate-300 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {s === 'all' ? 'ALL SERIES' : s.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tracks, cities, countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Main Content Area: Split View (List + Inspector) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Track Browser */}
          <div className="md:col-span-5 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-3 space-y-1.5 bg-slate-50/50 dark:bg-slate-950/40">
            {filteredTracks.map(t => {
              const isSelected = selectedTrack.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTrack(t)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-slate-800 border-blue-400 dark:border-cyan-500 shadow-sm'
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {t.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {t.city}, {t.country}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      {t.series}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold mt-1">
                      {(t.officialLapLengthMeters / 1000).toFixed(2)} km
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Track Inspector */}
          <div className="md:col-span-7 p-6 overflow-y-auto flex flex-col gap-5 bg-white dark:bg-slate-900">
            {/* Track Title Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {selectedTrack.name}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedTrack.city}, {selectedTrack.country} • Opened {selectedTrack.yearOpened || 'Historic'}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-blue-50 dark:bg-cyan-950 border border-blue-300 dark:border-cyan-500 text-blue-700 dark:text-cyan-300">
                {selectedTrack.series.toUpperCase()} • {selectedTrack.trackType.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {/* Interactive Track Map Preview */}
            <div className="w-full h-64 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center p-4 relative overflow-hidden shadow-inner">
              <div className="absolute inset-0 telemetry-grid opacity-30 pointer-events-none" />
              <svg
                viewBox={selectedTrack.viewBox}
                className="w-full h-full max-h-56"
              >
                <path
                  d={selectedTrack.svgPath}
                  fill={isDark ? '#00F0FF' : '#1D4ED8'}
                  fillOpacity={0.06}
                  stroke={isDark ? '#00F0FF' : '#1D4ED8'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Metric Blueprint Specifications */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold block">OFFICIAL LAP LENGTH</span>
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {selectedTrack.officialLapLengthMeters.toLocaleString()} m
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {selectedTrack.officialLapLengthMiles.toFixed(3)} miles
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold block">BOUNDING FOOTPRINT</span>
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {selectedTrack.boundingWidthMeters}m × {selectedTrack.boundingHeightMeters}m
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Width × Height
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold block">ENCLOSED LAND AREA</span>
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {selectedTrack.areaAcres ? `${selectedTrack.areaAcres} acres` : 'N/A'}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {selectedTrack.areaHectares ? `${selectedTrack.areaHectares} hectares` : `${selectedTrack.turns} turns`}
                </span>
              </div>
            </div>

            {/* Historical Scale Trivia */}
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-xs font-bold text-slate-500 uppercase">
                HISTORICAL SCALE TRIVIA & INSIGHTS
              </span>
              <div className="space-y-2">
                {selectedTrack.trivia.map((fact, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5 shadow-sm"
                  >
                    <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{fact}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
