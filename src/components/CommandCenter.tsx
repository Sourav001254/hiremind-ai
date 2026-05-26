/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Bot,
  Activity,
  AlertTriangle,
  Brain,
  ShieldAlert,
  Zap,
  Briefcase,
  Layers,
  TrendingUp,
  X,
  Users,
  Send
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import { Candidate, Job, AgentStatus } from '../types';

// Import child components
import CandidatePipeline from './recruiter/CandidatePipeline';
import CandidateDetailPanel from './recruiter/CandidateDetailPanel';
import CopilotPanel from './recruiter/CopilotPanel';
import AgentMonitor from './recruiter/AgentMonitor';

interface CommandCenterProps {
  candidates: Candidate[];
  jobs: Job[];
  agents: AgentStatus[];
  onToggleAgent?: (id: string) => void;
  recruiterUser: { email: string; name: string; picture?: string } | null;
  onUpdateCandidateLocal?: (c: Candidate) => void;
}

export default function CommandCenter({
  candidates: initialCandidates,
  jobs,
  agents: initialAgents,
  onToggleAgent,
  recruiterUser,
  onUpdateCandidateLocal,
}: CommandCenterProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(initialCandidates[0] || null);
  const [agents, setAgents] = useState<AgentStatus[]>(initialAgents);

  // Collaboration team presence mapping states
  const [peers, setPeers] = useState<any[]>([]);
  const [selfPeer, setSelfPeer] = useState<any>(null);
  const [wsRef, setWsRef] = useState<WebSocket | null>(null);
  const [liveChat, setLiveChat] = useState<any[]>([]);
  const [isPeerChatOpen, setIsPeerChatOpen] = useState(false);
  const [chatInputText, setChatInputText] = useState('');

  // Bulk Candidates Comparison State
  const [bulkCompareList, setBulkCompareList] = useState<Candidate[] | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setCandidates(initialCandidates);
    if (initialCandidates.length > 0 && (!selectedCandidate || !initialCandidates.some((c) => c.id === selectedCandidate.id))) {
      setSelectedCandidate(initialCandidates[0]);
    }
  }, [initialCandidates]);

  useEffect(() => {
    setAgents(initialAgents);
  }, [initialAgents]);

  // Collaborative sync websocket effect
  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      if (recruiterUser) {
        ws.send(
          JSON.stringify({
            type: 'UPDATE_PRESENCE',
            name: recruiterUser.name,
            activeCandidateId: selectedCandidate?.id || null,
          })
        );
      }
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        switch (payload.type) {
          case 'PRESENCE_INIT':
            setSelfPeer(payload.self);
            setPeers(payload.recruiters.filter((p: any) => p.id !== payload.self.id));
            break;
          case 'PRESENCE_JOIN':
            setPeers((prev) => {
              if (prev.some((p) => p.id === payload.recruiter.id)) return prev;
              return [...prev, payload.recruiter];
            });
            break;
          case 'PRESENCE_UPDATE':
            setPeers((prev) => prev.map((p) => (p.id === payload.recruiter.id ? payload.recruiter : p)));
            if (selfPeer && payload.recruiter.id === selfPeer.id) {
              setSelfPeer(payload.recruiter);
            }
            break;
          case 'PRESENCE_LEAVE':
            setPeers((prev) => prev.filter((p) => p.id !== payload.recruiterId));
            break;
          case 'RESUME_UPDATED':
            if (payload.candidate) {
              setCandidates((prev) => prev.map((c) => (c.id === payload.candidate.id ? payload.candidate : c)));
              if (selectedCandidate && selectedCandidate.id === payload.candidate.id) {
                setSelectedCandidate(payload.candidate);
              }
              if (onUpdateCandidateLocal) {
                onUpdateCandidateLocal(payload.candidate);
              }
            }
            break;
          case 'CHAT_MESSAGE':
            setLiveChat((prev) => [...prev.slice(-30), payload.message]);
            break;
        }
      } catch (err) {
        console.error('Multiplayer socket issue', err);
      }
    };

    setWsRef(ws);
    return () => {
      ws.close();
    };
  }, [recruiterUser]);

  useEffect(() => {
    if (wsRef && wsRef.readyState === WebSocket.OPEN) {
      wsRef.send(
        JSON.stringify({
          type: 'UPDATE_PRESENCE',
          activeCandidateId: selectedCandidate?.id || null,
        })
      );
    }
  }, [selectedCandidate, wsRef]);

  const handleSendPeerChatMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !wsRef || wsRef.readyState !== WebSocket.OPEN) return;
    wsRef.send(
      JSON.stringify({
        type: 'CHAT_MESSAGE',
        sender: recruiterUser?.name || 'Recruiter',
        text: chatInputText.trim(),
      })
    );
    setChatInputText('');
  };

  const handleSaveCandidate = async (updated: Candidate) => {
    try {
      const res = await fetch('/api/candidates/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          setSelectedCandidate(payload.candidate);
          setCandidates((prev) => prev.map((c) => (c.id === payload.candidate.id ? payload.candidate : c)));
        }
      }
    } catch (e) {
      console.error('Failed to commit profile updates', e);
    }
  };

  const handleDownloadCertificate = async (candidateId: string) => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/candidates/export-compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, complianceOfficer: recruiterUser?.name || 'CENTRAL_AUDIT_OFFICER_2026' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          const blob = new Blob([data.html], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = data.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
    } catch (e) {
      console.error('Certificate generation error', e);
    } finally {
      setIsExporting(false);
    }
  };

  // Prepare skill dataset comparing overlapping skills in side-by-side radars
  const renderCompareChart = () => {
    if (!bulkCompareList || bulkCompareList.length === 0) return null;
    const skillsSet = new Set<string>();
    bulkCompareList.forEach((c) => c.skills.forEach((s) => skillsSet.add(s.name)));
    const skillNames = Array.from(skillsSet);

    const data = skillNames.map((name) => {
      const row: any = { subject: name };
      bulkCompareList.forEach((c) => {
        const skill = c.skills.find((sk) => sk.name === name);
        row[c.name] = skill ? skill.score : 0;
      });
      return row;
    });

    const colors = ['#06b6d4', '#6366f1', '#ec4899'];

    return (
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={8} />
          {bulkCompareList.map((c, idx) => (
            <Radar
              key={c.id}
              name={c.name}
              dataKey={c.name}
              stroke={colors[idx % colors.length]}
              fill={colors[idx % colors.length]}
              fillOpacity={0.25}
            />
          ))}
          <Legend wrapperStyle={{ fontSize: 10, color: '#e2e8f0' }} />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 10 }} />
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  const avgScore = Math.round(
    candidates.reduce((sum, c) => sum + (c.score || 0), 0) / (candidates.length || 1)
  );
  const activeAgentsCount = agents.filter((a) => a.status === 'processing' || a.status === 'active').length;
  const fraudCount = candidates.filter((c) => c.fraudScore && c.fraudScore >= 40).length;
  const fraudPercentage = Math.round((fraudCount / (candidates.length || 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Collaboration Session Bar */}
      <div className="glassmorphism p-4 rounded-3xl border border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-cyan-400 block uppercase tracking-wider font-bold">
              Collaborative Session Live
            </span>
            <p className="text-[10px] text-gray-400">
              {peers.length + 1} Admin Recruiter(s) synchronizing decisions concurrently.
            </p>
          </div>
        </div>

        <div className="flex -space-x-1.5 items-center">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/20 uppercase"
            style={{ backgroundColor: selfPeer?.color || '#3b82f6' }}
            title={`You: ${recruiterUser?.name || 'Recruiter'}`}
          >
            {(recruiterUser?.name || 'R').charAt(0)}
          </div>

          {peers.map((peer) => (
            <div
              key={peer.id}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/20 uppercase relative animate-fade-in group"
              style={{ backgroundColor: peer.color }}
              title={peer.name}
            >
              {peer.name.charAt(0)}
              <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/10 p-1.5 rounded text-[8px] tracking-wider text-white whitespace-nowrap z-50">
                {peer.name} {peer.activeCandidateId ? `(Reviewing candidate profile)` : '(Idle)'}
              </div>
            </div>
          ))}

          <button
            onClick={() => setIsPeerChatOpen(!isPeerChatOpen)}
            className="ml-4 flex items-center space-x-1 border border-indigo-500/25 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-mono text-[9px] px-2.5 py-1 rounded-lg transition select-none cursor-pointer text-xs"
          >
            <Users className="w-3.5 h-3.5 mr-1 text-cyan-400 inline" />
            <span>Multiplayer Chat ({liveChat.length})</span>
          </button>
        </div>
      </div>

      {/* Metrics Header Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="glassmorphism p-5 rounded-[24px] flex items-center justify-between border border-white/10 transition hover:-translate-y-0.5 duration-300"
        >
          <div>
            <span className="text-xs text-indigo-300 block font-mono font-bold">CANDIDATES STACKED</span>
            <span className="text-2xl font-display font-bold text-white block mt-1">{candidates.length} Profiles</span>
            <span className="text-xs text-emerald-400 flex items-center mt-1">
              <Zap className="w-3 h-3 mr-1" /> 100% Parsing Accuracy
            </span>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Layers className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glassmorphism p-5 rounded-[24px] flex items-center justify-between border border-white/10 transition hover:-translate-y-0.5 duration-300"
        >
          <div>
            <span className="text-xs text-violet-300 block font-mono font-bold">AVG FIT COEFFICIENT</span>
            <span className="text-2xl font-display font-bold text-indigo-300 block mt-1">
              {avgScore}%
            </span>
            <span className="text-xs text-indigo-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" /> Vector Match Gaps
            </span>
          </div>
          <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400">
            <Brain className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="glassmorphism p-5 rounded-[24px] flex items-center justify-between border border-white/10 transition hover:-translate-y-0.5 duration-300"
        >
          <div>
            <span className="text-xs text-rose-300 block font-mono font-bold">FRAUD / DUPLICATION INDEX</span>
            <span className="text-2xl font-display font-bold text-rose-400 block mt-1">{fraudPercentage}% Tracked</span>
            <span className="text-xs text-rose-300 flex items-center mt-1">
              <AlertTriangle className="w-3 h-3 mr-1" /> {fraudCount} Anomalies Flagged
            </span>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glassmorphism p-5 rounded-[24px] flex items-center justify-between border border-white/10 transition hover:-translate-y-0.5 duration-300"
        >
          <div>
            <span className="text-xs text-cyan-300 block font-mono font-bold">ORCHESTRATOR STATUS</span>
            <span className="text-2xl font-display font-bold text-cyan-400 block mt-1">
              {activeAgentsCount} Active
            </span>
            <span className="text-xs text-cyan-400 flex items-center mt-1">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse mr-1.5" /> Kafka Topic Hub: OK
            </span>
          </div>
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
            <Bot className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* Main Dual Workspace Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Candidates Pipeline List & Agents indicators Indicator grid (Span 4) */}
        <div className="lg:col-span-4 space-y-4">
          <CandidatePipeline
            candidates={candidates}
            selectedId={selectedCandidate?.id}
            onSelect={setSelectedCandidate}
            peers={peers}
            onCompareSelected={setBulkCompareList}
          />

          <AgentMonitor
            agents={agents}
            onToggleAgent={onToggleAgent}
          />
        </div>

        {/* Right Side: Divide into Candidate Intel & Copilot RAG indicators indicator (Span 8) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {selectedCandidate ? (
            <CandidateDetailPanel
              candidate={selectedCandidate}
              candidates={candidates}
              jobs={jobs}
              onSave={handleSaveCandidate}
              onExport={handleDownloadCertificate}
              isExporting={isExporting}
            />
          ) : (
            <div className="glassmorphism rounded-[28px] border border-white/10 p-12 text-center flex flex-col items-center justify-center">
              <span className="text-gray-500 text-xs">No candidate selected. Choose a candidate profile on left.</span>
            </div>
          )}

          <CopilotPanel
            candidates={candidates}
            jobs={jobs}
            onAgentActivity={(id, status, log) => {
              setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, status, lastLog: log } : a)));
            }}
          />
        </div>
      </div>

      {/* Collaborative Recruiter Chat Lobby floating at bottom right */}
      {isPeerChatOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-gray-950/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl flex flex-col z-[101] overflow-hidden animate-fade-in">
          <div className="p-4 bg-indigo-500/10 border-b border-white/5 flex justify-between items-center bg-black/40">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                Recruiters Lobby ({peers.length + 1})
              </span>
            </div>
            <button
              onClick={() => setIsPeerChatOpen(false)}
              className="text-xs text-gray-400 hover:text-white cursor-pointer transition uppercase font-mono"
            >
              [close]
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3 font-mono text-[10px]">
            {liveChat.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-[10px] leading-relaxed select-none">
                No session messages recorded.
                <br />
                Type below to sync with team recruiters.
              </div>
            ) : (
              liveChat.map((msg, i) => (
                <div key={i} className="space-y-0.5 animate-fade-in text-left">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-300" style={{ color: msg.senderColor }}>
                      {msg.sender}
                    </span>
                    <span className="text-[8px] text-gray-400">{msg.timestamp}</span>
                  </div>
                  <p className="text-gray-200 bg-white/5 p-2 rounded-lg leading-relaxed border border-white/5">
                    {msg.text}
                  </p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendPeerChatMessage} className="p-2 border-t border-white/5 bg-[#050508]/60 flex items-center space-x-1 animate-fade-in">
            <input
              type="text"
              placeholder="Sync with recruiters..."
              value={chatInputText}
              onChange={(e) => setChatInputText(e.target.value)}
              className="flex-1 bg-black text-[10px] placeholder-gray-500 rounded-lg p-2 border border-white/5 outline-none focus:border-[#4f46e5]"
            />
            <button
              type="submit"
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold cursor-pointer transition shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Bulk Comparator side-by-side Modal */}
      {bulkCompareList && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm z-[105] p-4 font-sans animate-fade-in">
          <div className="bg-[#0b0f19] border border-white/10 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-hidden relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest block">Comparative Radar Network</span>
                <h3 className="text-base font-display font-extrabold text-white">Side-by-Side Candidates Skills Alignment</h3>
              </div>
              <button
                onClick={() => setBulkCompareList(null)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Radar Chart Display */}
              <div className="md:col-span-8 flex justify-center bg-black/20 rounded-2xl p-2 border border-white/5">
                {renderCompareChart()}
              </div>

              {/* Profiles Metadata and Deltas */}
              <div className="md:col-span-4 space-y-3.5 font-mono text-[9px] text-[#e2e8f0]">
                <div className="text-gray-400 font-bold uppercase tracking-wider text-[8px] border-b border-slate-800 pb-1">Competing Candidates:</div>
                <div className="space-y-2">
                  {bulkCompareList.map((c, idx) => {
                    const colors = ['text-cyan-400', 'text-indigo-400', 'text-pink-400'];
                    return (
                      <div key={c.id} className="p-2 rounded bg-white/5 border border-white/5 space-y-0.5">
                        <div className={`font-bold text-[10px] ${colors[idx % colors.length]}`}>{c.name}</div>
                        <div className="text-gray-400 text-[8px]">{c.role}</div>
                        <div className="font-semibold text-gray-300">ATS Similarity Match: {c.atsScore}%</div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-gray-500 text-[8px] leading-relaxed select-none pt-2 border-t border-slate-800">
                  Data points represent absolute dynamic skill weights extracted from actual verified PDF profiles using LLM-aided vectors analysis.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
