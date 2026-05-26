/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Briefcase, Users } from 'lucide-react';
import { Candidate } from '../../types';

interface CandidatePipelineProps {
  candidates: Candidate[];
  selectedId: string | undefined;
  onSelect: (candidate: Candidate) => void;
  peers: any[];
  onCompareSelected: (selectedCandidates: Candidate[]) => void;
}

export default function CandidatePipeline({
  candidates,
  selectedId,
  onSelect,
  peers,
  onCompareSelected,
}: CandidatePipelineProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high' | 'alert' | 'fintech'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'fraud' | 'ats'>('score');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  // Filtering
  const filtered = candidates.filter((cand) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      cand.name.toLowerCase().includes(query) ||
      cand.role.toLowerCase().includes(query) ||
      cand.skills.some((s) => s.name.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'high') return cand.score >= 85;
    if (selectedFilter === 'alert') return cand.fraudScore >= 40;
    if (selectedFilter === 'fintech') return cand.role.toLowerCase().includes('fintech');
    return true;
  });

  // Sorting
  const sortedAndFiltered = [...filtered].sort((a, b) => {
    if (sortBy === 'score') {
      return b.score - a.score;
    } else if (sortBy === 'fraud') {
      return b.fraudScore - a.fraudScore;
    } else if (sortBy === 'ats') {
      return b.atsScore - a.atsScore;
    }
    return 0;
  });

  const handleCheckboxChange = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        if (prev.length >= 3) return prev; // Limit to 3 max
        return [...prev, id];
      }
    });
  };

  const handleCompareClick = () => {
    const selected = candidates.filter((c) => checkedIds.includes(c.id));
    if (selected.length >= 2) {
      onCompareSelected(selected);
    }
  };

  return (
    <div className="glassmorphism p-6 rounded-[28px] border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-white tracking-wide flex items-center text-sm">
          <Briefcase className="w-4 h-4 mr-2 text-indigo-400" /> Pipeline Candidates
        </h3>
        <span className="text-xs font-mono text-gray-400 opacity-70">org-auth: 2026-hq</span>
      </div>

      {/* Search and Sort */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by profile or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#08080f] text-gray-200 placeholder-gray-500 text-xs rounded-lg pl-8 pr-3 py-2 border border-white/5 focus:border-indigo-500/50 outline-none transition"
          />
          <Search className="w-3 h-3 text-gray-400 absolute left-3 top-3" />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#08080f] text-gray-300 text-[10px] rounded border border-white/10 px-2 py-1 outline-none focus:border-indigo-500/50"
          >
            <option value="score">Match Score</option>
            <option value="fraud">Fraud Risk</option>
            <option value="ats">ATS Match</option>
          </select>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-1.5 justify-between items-center">
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`text-[10px] font-mono px-2 py-0.5 rounded transition ${
              selectedFilter === 'all'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'bg-[#08080f] text-gray-400 border border-white/5 hover:border-white/10'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedFilter('high')}
            className={`text-[10px] font-mono px-2 py-0.5 rounded transition ${
              selectedFilter === 'high'
                ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40'
                : 'bg-[#08080f] text-gray-400 border border-white/5 hover:border-white/10'
            }`}
          >
            Fit ≥ 85%
          </button>
          <button
            onClick={() => setSelectedFilter('alert')}
            className={`text-[10px] font-mono px-2 py-0.5 rounded transition ${
              selectedFilter === 'alert'
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                : 'bg-[#08080f] text-gray-400 border border-white/5 hover:border-white/10'
            }`}
          >
            Alerts
          </button>
        </div>

        {checkedIds.length >= 2 && (
          <button
            onClick={handleCompareClick}
            className="text-[10px] px-2 py-0.5 rounded border border-cyan-400/30 bg-cyan-950/20 text-cyan-300 hover:bg-cyan-950/40 font-bold transition flex items-center gap-1 active:scale-95"
          >
            Compare ({checkedIds.length})
          </button>
        )}
      </div>

      {/* Candidate list items */}
      <div className="space-y-2 h-[340px] overflow-y-auto pr-1">
        {sortedAndFiltered.map((cand, index) => {
          const isSelected = selectedId === cand.id;
          const isChecked = checkedIds.includes(cand.id);
          return (
            <motion.div
              key={cand.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelect(cand)}
              className={`p-3.5 rounded-2xl border transition duration-300 cursor-pointer flex items-center justify-between gap-2 ${
                isSelected
                  ? 'border-[#06b6d4] bg-white/[0.08] shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-[1.01]'
                  : 'border-white/10 bg-white/5 hover:bg-white/[0.08]'
              }`}
            >
              <div className="flex items-center gap-2 max-w-[70%]">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onClick={(e) => handleCheckboxChange(cand.id, e)}
                  onChange={() => {}} // Controlled dummy handler
                  className="rounded border-white/10 bg-black/40 text-cyan-500 focus:ring-0 cursor-pointer w-3.5 h-3.5 shrink-0"
                />

                <div className="space-y-0.5 truncate">
                  <div className="text-xs font-semibold text-white flex items-center gap-1 flex-wrap">
                    <span className="truncate">{cand.name}</span>
                    {cand.fraudScore >= 40 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title="Security Flag Active" />
                    )}

                    {/* Rendering concurrent peer recruiters */}
                    {peers.map((p) =>
                      p.activeCandidateId === cand.id ? (
                        <span
                          key={p.id}
                          className="text-[7px] leading-none font-bold text-white px-1 py-0.5 rounded-md border border-white/10 animate-pulse shrink-0"
                          style={{ backgroundColor: p.color }}
                          title={`${p.name} is reviewing profile concurrently...`}
                        >
                          👁 {p.name.split(' ')[0]}
                        </span>
                      ) : null
                    )}
                  </div>
                  <div className="text-[9px] text-gray-400 font-mono truncate">{cand.role}</div>

                  {/* Skills badges */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {cand.skills.slice(0, 2).map((s) => (
                      <span
                        key={s.name}
                        className="text-[8px] bg-white/5 text-gray-300 px-1 py-0.2 rounded font-mono border border-white/5"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className={`text-xs font-display font-bold ${cand.score >= 85 ? 'text-emerald-400' : 'text-indigo-300'}`}>
                  {cand.score}%
                </div>
                <span className="text-[7px] font-mono text-gray-500 block uppercase">Match Score</span>
              </div>
            </motion.div>
          );
        })}

        {sortedAndFiltered.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-xs">
            No profiles match the filter/sorting queries.
          </div>
        )}
      </div>
    </div>
  );
}
