/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  HelpCircle,
  Mail,
  Send,
  Zap,
  Clock,
  Briefcase
} from 'lucide-react';
import { Candidate, Job } from '../../types';

interface CandidateDetailPanelProps {
  candidate: Candidate;
  candidates: Candidate[];
  jobs: Job[];
  onSave: (updated: Candidate) => Promise<void>;
  onExport: (candidateId: string) => void;
  isExporting?: boolean;
}

export default function CandidateDetailPanel({
  candidate,
  candidates,
  jobs,
  onSave,
  onExport,
  isExporting = false,
}: CandidateDetailPanelProps) {
  // Compare State
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareCandidate, setCompareCandidate] = useState<Candidate | null>(null);

  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editSkillsList, setEditSkillsList] = useState<{ name: string; score: number }[]>([]);

  // Email Outreach State
  const [isOutreachOpen, setIsOutreachOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job>(jobs[0] || { id: 'job-1', title: 'Senior Software Engineer' });
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [outreachStatus, setOutreachStatus] = useState<'idle' | 'drafted' | 'sending' | 'success' | 'err'>('idle');
  const [outreachError, setOutreachError] = useState('');

  const handleSaveCandidateEdit = async () => {
    const updated: Candidate = {
      ...candidate,
      skills: editSkillsList,
    };
    await onSave(updated);
    setIsEditOpen(false);
  };

  const startDraftEmail = async () => {
    setIsDrafting(true);
    setOutreachStatus('idle');
    setOutreachError('');
    try {
      const res = await fetch('/api/outreach/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          jobId: selectedJob.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailSubject(data.subject);
        setEmailBody(data.body);
        setOutreachStatus('drafted');
      } else {
        throw new Error(data.error || 'Failed to formulate the draft invite email.');
      }
    } catch (err: any) {
      console.error(err);
      setOutreachError(err.message || String(err));
      setOutreachStatus('err');
    } finally {
      setIsDrafting(false);
    }
  };

  const sendEmailOutreach = async () => {
    setIsSendingMail(true);
    setOutreachStatus('sending');
    try {
      const res = await fetch('/api/outreach/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: candidate.email,
          subject: emailSubject,
          body: emailBody,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOutreachStatus('success');
      } else {
        throw new Error(data.error || 'Failed to dispatch transactional communication.');
      }
    } catch (err: any) {
      console.error(err);
      setOutreachError(err.message || String(err));
      setOutreachStatus('err');
    } finally {
      setIsSendingMail(false);
    }
  };

  return (
    <div className="glassmorphism rounded-[28px] border border-white/10 flex flex-col justify-between overflow-hidden shadow-lg min-h-[500px]">
      {isCompareOpen ? (
        <>
          <div className="p-4 bg-gradient-to-r from-red-500/5 to-transparent border-b border-white/5 flex justify-between items-center bg-black/25">
            <div>
              <h2 className="text-sm font-display font-medium text-white">Compare Analytics Node</h2>
              <span className="text-[10px] text-gray-500 font-mono">Comparing side-by-side</span>
            </div>
            <button
              onClick={() => setIsCompareOpen(false)}
              className="text-[10px] text-rose-400 font-mono hover:text-white px-2 py-0.5 bg-rose-950/20 rounded border border-rose-500/30 transition cursor-pointer"
            >
              Exit VS Map
            </button>
          </div>

          <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[430px]">
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono text-gray-400 uppercase block">Select Target Competitor</label>
              <select
                value={compareCandidate?.id || ''}
                onChange={(e) => setCompareCandidate(candidates.find((c) => c.id === e.target.value) || null)}
                className="w-full bg-[#050508] border border-white/5 rounded-lg p-2 text-xs text-slate-300 outline-none"
              >
                <option value="">-- Choose Profile --</option>
                {candidates
                  .filter((c) => c.id !== candidate.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.role})
                    </option>
                  ))}
              </select>
            </div>

            {compareCandidate ? (
              <div className="space-y-4 text-xs font-mono pt-2">
                <div className="grid grid-cols-2 gap-2 text-center border-b border-white/5 pb-2">
                  <div className="text-indigo-400 font-bold text-[11px] truncate">{candidate.name}</div>
                  <div className="text-cyan-400 font-bold text-[11px] truncate">{compareCandidate.name}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-gray-500 uppercase block">Overall Match Rank</span>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-indigo-950/10 p-2 rounded border border-indigo-500/10 text-lg font-black text-indigo-300">
                      {candidate.score}%
                    </div>
                    <div className="bg-cyan-950/10 p-2 rounded border border-cyan-500/10 text-lg font-black text-cyan-300">
                      {compareCandidate.score}%
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-gray-500 uppercase block font-mono">Keyword Relevance Match</span>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-900/40 p-1.5 rounded font-bold border border-white/5">
                      {candidate.atsScore}%
                    </div>
                    <div className="bg-slate-900/40 p-1.5 rounded font-bold border border-white/5">
                      {compareCandidate.atsScore}%
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-gray-500 uppercase block font-mono">Semantic Vector Alignment</span>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-900/40 p-1.5 rounded text-gray-300 border border-white/5">
                      {candidate.matchBreakdown?.semantic || 0}%
                    </div>
                    <div className="bg-slate-900/40 p-1.5 rounded text-gray-300 border border-white/5">
                      {compareCandidate.matchBreakdown?.semantic || 0}%
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-gray-500 uppercase block font-mono">Threat Alerts Raised</span>
                  <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                    <div
                      className={`p-1 rounded font-bold ${
                        candidate.fraudScore > 40 ? 'text-rose-400 bg-rose-500/5' : 'text-emerald-400 bg-emerald-500/5'
                      }`}
                    >
                      {candidate.fraudScore > 40 ? '⚠️ SEC_FLAG' : '✔ PASSED'}
                    </div>
                    <div
                      className={`p-1 rounded font-bold ${
                        compareCandidate.fraudScore > 40
                          ? 'text-rose-400 bg-rose-500/5'
                          : 'text-emerald-400 bg-emerald-500/5'
                      }`}
                    >
                      {compareCandidate.fraudScore > 40 ? '⚠️ SEC_FLAG' : '✔ PASSED'}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[10px] font-sans text-gray-300 space-y-1 leading-relaxed">
                  <span className="font-bold text-indigo-300 uppercase block font-mono text-[8px] tracking-wider">
                    Synthesized Fit Delta:
                  </span>
                  {candidate.score > compareCandidate.score ? (
                    <span>
                      <strong>{candidate.name}</strong> holds a higher aggregate index mapping (+
                      {candidate.score - compareCandidate.score}%) due to deeper credentials in specialized targets and
                      lower overall anomaly risks.
                    </span>
                  ) : candidate.score < compareCandidate.score ? (
                    <span>
                      <strong>{compareCandidate.name}</strong> leading match coefficients (+
                      {compareCandidate.score - candidate.score}%) with slightly tighter core technical alignment.
                    </span>
                  ) : (
                    <span>
                      Equilibrium detected. Both engineers are perfectly suited matches representing identical vector
                      matching alignments.
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 font-sans text-[11px]">
                Select a second candidate from the dropdown list to run a dynamic side-by-side gap audit.
              </div>
            )}
          </div>
        </>
      ) : isEditOpen ? (
        <>
          <div className="p-4 bg-gradient-to-r from-teal-500/5 to-transparent border-b border-white/5 flex justify-between items-center bg-black/25">
            <div>
              <h2 className="text-sm font-display font-medium text-white">Adjust Candidate Match Weights</h2>
              <span className="text-[10px] text-gray-500 font-mono">Configure custom skills weights</span>
            </div>
            <button
              onClick={() => setIsEditOpen(false)}
              className="text-[10px] text-gray-400 font-mono hover:text-white px-2 py-0.5 bg-slate-800 rounded border border-white/5 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[430px]">
            <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
              Modifying skill proficiencies simulates real-time neural network parameter alterations. Dynamic ranking match
              calculates automatically on save.
            </p>

            <div className="space-y-2.5">
              {editSkillsList.map((skill, idx) => (
                <div key={idx} className="space-y-1 bg-black/20 p-2.5 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-300">
                    <span className="truncate max-w-[150px] font-semibold">{skill.name}</span>
                    <span className="font-bold text-cyan-400">{skill.score}/100</span>
                  </div>
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="range"
                      min="30"
                      max="100"
                      value={skill.score}
                      onChange={(e) => {
                        const updatedVal = parseInt(e.target.value);
                        setEditSkillsList((prev) =>
                          prev.map((s, i) => (i === idx ? { ...s, score: updatedVal } : s))
                        );
                      }}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveCandidateEdit}
              className="w-full py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-90 font-bold rounded-lg text-white font-mono text-[10px] uppercase tracking-wider transition-all duration-300 shadow shadow-cyan-500/10 cursor-pointer"
            >
              Save & Recalculate Weights
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Visual Profile Details Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-500/5 to-transparent border-b border-white/5 flex justify-between items-center">
            <div>
              <h2 className="text-base font-display font-bold text-white tracking-wide">{candidate.name}</h2>
              <span className="text-[11px] text-indigo-400 font-mono block mt-0.5">{candidate.role}</span>
            </div>

            <div className="text-center p-2 rounded bg-indigo-500/10 border border-indigo-500/20">
              <div className="text-xl font-display font-black text-white">{candidate.score}%</div>
              <div className="text-[8px] font-mono text-indigo-300 block uppercase">Match Coefficient</div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="px-4 py-2 bg-[#050508]/40 border-b border-white/5 flex flex-wrap gap-2 justify-between items-center text-[10px]">
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  setEditSkillsList([...candidate.skills]);
                  setIsEditOpen(true);
                }}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 font-mono border border-white/10 transition cursor-pointer"
              >
                ✏️ Adjust
              </button>
              <button
                onClick={() => {
                  setCompareCandidate(candidates.find((c) => c.id !== candidate.id) || null);
                  setIsCompareOpen(true);
                }}
                className="px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/25 transition cursor-pointer"
              >
                ⚖️ VS Map
              </button>
              <button
                onClick={() => setIsOutreachOpen(true)}
                className="px-2 py-1 rounded bg-fuchsia-500/15 hover:bg-fuchsia-500/20 text-fuchsia-300 font-mono border border-fuchsia-400/25 transition cursor-pointer flex items-center gap-1"
              >
                <Mail className="w-3 h-3 text-fuchsia-400 inline" /> Invite
              </button>
            </div>
            <button
              onClick={() => onExport(candidate.id)}
              disabled={isExporting}
              className="px-2 py-1 rounded bg-cyan-400/15 hover:bg-cyan-400/20 text-cyan-300 font-mono border border-cyan-400/25 transition disabled:opacity-50 cursor-pointer"
            >
              {isExporting ? "⏳ Packaging..." : "📜 Export PDF"}
            </button>
          </div>

          {/* Candidate Profile Insights Content Body */}
          <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[385px]">
            {/* ATS Compatibility Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-300 font-mono">ATS Similarity Breakdown</span>
                <span className="font-mono text-indigo-300 font-bold">{candidate.atsScore}% Keyword Overlay</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded bg-[#08080f]/50 border border-white/5">
                  <div className="text-xs text-indigo-300 font-mono font-bold">
                    {candidate.matchBreakdown?.semantic || 0}%
                  </div>
                  <div className="text-[7px] text-gray-500 block mt-0.5">Semantic Cosine</div>
                </div>
                <div className="p-2 rounded bg-[#08080f]/50 border border-white/5">
                  <div className="text-xs text-indigo-300 font-mono font-bold">
                    {candidate.matchBreakdown?.keywords || 0}%
                  </div>
                  <div className="text-[7px] text-gray-500 block mt-0.5">Keywords Match</div>
                </div>
                <div className="p-2 rounded bg-[#08080f]/50 border border-rose-500/10">
                  <div
                    className={`text-xs font-mono font-bold ${
                      candidate.fraudScore > 40 ? 'text-rose-400' : 'text-gray-300'
                    }`}
                  >
                    {candidate.fraudScore}%
                  </div>
                  <div className="text-[7px] text-gray-500 block mt-0.5">Fraud Identity</div>
                </div>
              </div>
            </div>

            {/* Estimated Skills */}
            <div className="space-y-2">
              <h4 className="text-[9px] text-gray-400 font-mono uppercase tracking-wider">Estimated Core Skill Vectors</h4>
              <div className="grid grid-cols-2 gap-2">
                {candidate.skills.map((s) => (
                  <div key={s.name} className="p-2 rounded bg-[#08080f]/40 border border-white/5 space-y-1">
                    <div className="flex justify-between text-[9px] text-gray-300 font-medium">
                      <span className="truncate">{s.name}</span>
                      <span className="font-mono">{s.score}/100</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1">
                      <div className="bg-cyan-400 h-1 rounded-full" style={{ width: `${s.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exp timeline */}
            {candidate.experience && candidate.experience.length > 0 && (
              <div className="space-y-2 border-t border-white/5 pt-3">
                <h4 className="text-[9px] text-gray-400 font-mono uppercase tracking-wider flex items-center">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400 mr-1" /> Career History Timeline
                </h4>
                <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10 pl-6">
                  {candidate.experience.map((exp, idx) => (
                    <div key={idx} className="relative space-y-0.5">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-slate-950" />
                      <div className="flex justify-between items-center text-[9px] text-cyan-300 font-mono">
                        <span className="font-bold">{exp.role}</span>
                        <span className="text-gray-500">{exp.duration}</span>
                      </div>
                      <div className="text-[8px] text-gray-400">{exp.company}</div>
                      <p className="text-[8px] text-gray-500 leading-relaxed">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SHAP Feature impacts */}
            <div className="space-y-2 border-t border-white/5 pt-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[9px] text-gray-400 font-mono uppercase tracking-wider flex items-center">
                  <CheckCircle2 className="w-3 h-3 text-indigo-400 mr-1" /> SHAP Feature Impact Weights
                </h4>
                <HelpCircle
                  className="w-3 h-3 text-gray-500 cursor-help"
                  title="SHAP represents game theory metrics pointing which attributes influenced overall score matching upward or downward."
                />
              </div>

              <div className="space-y-1.5">
                {candidate.shapValues.map((val) => {
                  const isPositive = val.value >= 0;
                  return (
                    <div key={val.feature} className="flex items-center justify-between text-[9px]">
                      <span className="text-gray-300 truncate w-2/5 font-mono">{val.feature}</span>
                      <div className="w-2/5 bg-white/5 h-2 rounded relative mx-2">
                        {isPositive ? (
                          <div
                            className="bg-emerald-400 h-2 rounded-r absolute"
                            style={{ left: '50%', width: `${Math.min(50, val.value * 1.5)}%` }}
                          />
                        ) : (
                          <div
                            className="bg-rose-400 h-2 rounded-l absolute"
                            style={{ right: '50%', width: `${Math.min(50, Math.abs(val.value) * 1.5)}%` }}
                          />
                        )}
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20" />
                      </div>
                      <span className={`w-1/5 font-mono text-right ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? `+${val.value}` : val.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Duplicity & Alerts */}
            {(candidate.redFlags.length > 0 || candidate.fraudScore >= 40) && (
              <div className="p-3 bg-rose-500/5 rounded border border-rose-500/20 space-y-1.5 text-[9px]">
                <div className="flex items-center text-rose-400 font-mono font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Autonomous Compliance Alerts
                </div>
                <p className="text-gray-300">{candidate.fraudDetails?.reason || 'Compliance verification warning.'}</p>
                <ul className="list-disc list-inside text-gray-400 space-y-0.5">
                  {candidate.redFlags.map((rf, i) => (
                    <li key={i}>{rf}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Roadmaps */}
            {candidate.roadmap && candidate.roadmap.length > 0 && (
              <div className="space-y-2 border-t border-white/5 pt-3">
                <h4 className="text-[9px] text-gray-400 font-mono uppercase tracking-wider flex items-center">
                  <GraduationCap className="w-3.5 h-3.5 text-cyan-400 mr-1" /> Dynamic Career Advancement Maps
                </h4>
                <div className="space-y-1 bg-[#08080f]/40 p-3 rounded border border-white/5">
                  {candidate.roadmap.map((step, idx) => (
                    <div key={idx} className="flex items-start text-[9px] space-x-2">
                      <span className="text-cyan-400 font-mono font-bold">{idx + 1}.</span>
                      <span className="text-gray-300">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* RAG-Link AI Email Outreach Modal */}
      {isOutreachOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-[100] animate-fade-in p-4">
          <div className="bg-slate-950 border border-white/10 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl p-6 space-y-4 overflow-hidden relative">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <div>
                <span className="text-[9px] font-mono text-fuchsia-400 uppercase tracking-widest block">Recruiter Campaign Hub</span>
                <h3 className="text-base font-display font-bold text-white flex items-center">
                  <Mail className="w-4 h-4 text-fuchsia-400 mr-1.5" /> Outbound Interview Invite
                </h3>
              </div>
              <button
                onClick={() => setIsOutreachOpen(false)}
                className="text-xs text-gray-400 hover:text-white transition uppercase font-mono border border-white/10 px-2 py-0.5 rounded bg-[#08080f]"
              >
                [ESC]
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-[10px] space-y-1.5">
                <div className="text-gray-400 font-semibold uppercase font-mono tracking-wider">Candidate Target:</div>
                <div className="text-white text-xs font-bold">{candidate.name} ({candidate.email})</div>
                <div className="text-gray-500">Matches current profiles stack. Prompt models to generate unique outbound pitch.</div>
              </div>

              {/* Job Selector */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-gray-400 block uppercase">Outreach Context / Job Role:</label>
                <select
                  value={selectedJob.id}
                  onChange={(e) => setSelectedJob(jobs.find((j) => j.id === e.target.value) || jobs[0])}
                  className="w-full bg-[#050508] border border-white/10 rounded-lg p-2.5 text-xs text-slate-300 outline-none"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} (- {j.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions & Editor */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={startDraftEmail}
                  disabled={isDrafting}
                  className="w-full py-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:opacity-95 font-bold rounded-xl text-white font-mono text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-fuchsia-300" />
                  {isDrafting ? "Drafting with Gemini..." : "Synthesize personalized Draft with Gemini"}
                </button>
              </div>

              {outreachStatus === 'err' && (
                <div className="p-3.5 rounded bg-rose-500/5 border border-rose-500/10 text-[9px] font-mono text-rose-400">
                  ⚠️ Draft Discrepancy: {outreachError}
                </div>
              )}

              {outreachStatus === 'success' && (
                <div className="p-3.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Interview invitation sent successfully! Transaction logged inside server audit logs.</span>
                </div>
              )}

              {(outreachStatus === 'drafted' || outreachStatus === 'sending' || outreachStatus === 'success') && (
                <div className="space-y-3 pt-2">
                  {/* Subject Input */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-gray-400 block uppercase">Draft Subject Line:</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full bg-[#050508] border border-white/10 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  {/* Body Textarea */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-gray-400 block uppercase">Editable Invitation Body:</label>
                    <textarea
                      rows={8}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full bg-[#050508] border border-white/10 rounded-lg p-2.5 text-[10px] text-slate-300 font-sans outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  {outreachStatus !== 'success' && (
                    <button
                      type="button"
                      onClick={sendEmailOutreach}
                      disabled={isSendingMail}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl font-mono text-[10px] uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-300" />
                      {isSendingMail ? "Dispatched SMTP server transfer..." : "Dispatched Invite via Nodemailer"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
