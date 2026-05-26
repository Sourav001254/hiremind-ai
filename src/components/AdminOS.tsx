/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  Activity,
  Terminal,
  ShieldCheck,
  Zap,
  Clock,
  RefreshCcw,
  Sliders,
  TrendingUp,
  AlertTriangle,
  Server,
  Network
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { SystemEvent, AuditLogItem, BiasReport } from '../types';

interface AdminOSProps {
  events: SystemEvent[];
  auditLogs: AuditLogItem[];
  biasReport: BiasReport;
}

export default function AdminOS({ events: initialEvents, auditLogs: initialAuditLogs, biasReport }: AdminOSProps) {
  const [events, setEvents] = useState<SystemEvent[]>(initialEvents);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(initialAuditLogs);
  const [selectedAudit, setSelectedAudit] = useState<AuditLogItem | null>(initialAuditLogs[0] || null);

  // Health Metrics
  const [throughput, setThroughput] = useState(14.5);
  const [latency, setLatency] = useState(128); //ms
  const [postgresPool, setPostgresPool] = useState('9/20 Active');

  // Active event pipeline index
  const [activePipelineStage, setActivePipelineStage] = useState<number>(-1);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePipelineStage((prev) => (prev + 1) % 6);
      
      // Marginal fluctuative traffic outputs
      setThroughput(p => +(p + (Math.random() - 0.5) * 0.8).toFixed(1));
      setLatency(p => Math.floor(Math.max(90, p + (Math.random() - 0.5) * 10)));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const triggerTestPipeline = () => {
    setActivePipelineStage(0);
    const testEvt: SystemEvent = {
      id: `evt-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      topic: "hiremind.resume.uploaded",
      status: "success",
      payload: { source: "manual.diagnostic.trigger", org_id: "diagnostic-alpha" }
    };
    setEvents(p => [testEvt, ...p.slice(0, 5)]);
  };

  // Format Gender Representation data for Recharts Pie
  const genderData = [
    { name: 'Female', value: biasReport.genderRepresentation.female },
    { name: 'Male', value: biasReport.genderRepresentation.male },
    { name: 'Non-Binary', value: biasReport.genderRepresentation.nonbinary },
  ];
  const GENDER_COLORS = ['#06b6d4', '#6366f1', '#8b5cf6'];

  // Fallback age distribution values if undefined from mock config
  const ageData = biasReport.ageDistribution || [
    { range: '20-25', count: 4 },
    { range: '26-35', count: 12 },
    { range: '36-45', count: 9 },
    { range: '46-55', count: 3 },
    { range: '56+', count: 1 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Live Event-Driven Bus Visualizer */}
      <div className="glassmorphism p-6 rounded-[28px] border border-white/10 space-y-5 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-display font-bold text-white flex items-center">
              <Network className="w-4 h-4 mr-1.5 text-cyan-400" /> Layer 5 Kafka & Redis Micro-Orchestrator Pipeline Visualizer
            </h3>
            <p className="text-[10px] text-gray-400">Triggers real-time event cascading on standard message routing segments.</p>
          </div>
          <button
            onClick={triggerTestPipeline}
            className="flex items-center space-x-1 border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-mono text-[9px] px-2.5 py-1 rounded transition cursor-pointer"
          >
            <Zap className="w-3 h-3 text-cyan-300" />
            <span>Emit Test Upload Event</span>
          </button>
        </div>

        {/* Node visual elements */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-3 relative">
          {[
            { label: "1. Resume Uploaded", topic: "resume.uploaded", desc: "S3 PDF source parsed" },
            { label: "2. Vector Embedded", topic: "resume.parsed", desc: "1536-dim Pinecone upload" },
            { label: "3. Keyword ATS Score", topic: "candidate.matched", desc: "Overlap metrics run" },
            { label: "4. Fraud Check", topic: "fraud.detected", desc: "IsolationForest complete" },
            { label: "5. ML Ensemble Rank", topic: "candidate.ranked", desc: "SHAP weights compile" },
            { label: "6. Dashboard Sync", topic: "realtime.broadcast", desc: "Redis state WebSocket push" }
          ].map((node, i) => {
            const isActive = activePipelineStage === i;
            const isCompleted = activePipelineStage > i;
            return (
              <div
                key={i}
                className={`p-3 rounded-lg border transition duration-500 text-center relative ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-400/5 shadow-[0_0_15px_rgba(6,182,212,0.15)] transform scale-102 font-bold'
                    : isCompleted
                    ? 'border-indigo-500/40 bg-[#08080f]/60'
                    : 'border-white/5 bg-[#050508]/30 opacity-60'
                }`}
              >
                {i < 5 && (
                  <div className={`hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 z-10 ${
                    isCompleted ? 'bg-indigo-500' : 'bg-white/5'
                  }`} />
                )}

                <div className="text-[10px] text-white font-display truncate">{node.label}</div>
                <div className="text-[8px] font-mono text-gray-500 mt-1 uppercase block">{node.topic}</div>
                <p className="text-[8px] text-gray-400 mt-1 leading-tight">{node.desc}</p>
                
                {isActive && (
                  <div className="absolute inset-0 bg-cyan-400/5 rounded-lg animate-ping pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Historic Audit logs explainability container (Span 7) */}
        <div className="lg:col-span-7 space-y-4 font-sans">
          <div className="glassmorphism p-6 rounded-[28px] border border-white/10 space-y-5 shadow-lg">
            <h3 className="text-xs font-display font-bold text-white flex items-center mb-1">
              <Terminal className="w-4 h-4 mr-1.5 text-indigo-400 animate-pulse" /> Immutable SOC2 audit logs & XAI explainability metadata
            </h3>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {auditLogs.map((log) => {
                const isSelected = selectedAudit?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedAudit(log)}
                    className={`p-4 rounded-2xl border transition duration-300 cursor-pointer flex justify-between items-start ${
                      isSelected
                        ? 'border-[#06b6d4] bg-white/[0.08] shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-[1.01]'
                        : 'border-white/10 bg-white/5 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold">
                          {log.action}
                        </span>
                        <span className="text-[8px] font-mono text-gray-500">{log.timestamp}</span>
                      </div>
                      <p className="text-[10px] text-gray-300 leading-relaxed font-sans">{log.details}</p>
                      <div className="text-[8px] text-gray-500 font-mono font-semibold">Actor ID: {log.actor}</div>
                    </div>

                    <span className="text-[8px] text-gray-600 block uppercase font-mono">{log.id}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedAudit && (
            <div className="glassmorphism p-5 rounded-[24px] border border-white/10 animate-fade-in space-y-3 shadow-md">
              <h4 className="text-[10px] font-mono text-gray-400 slot-header uppercase tracking-widest flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 mr-1.5" /> SHAP/XAI Payload details [Target: {selectedAudit.targetId}]
              </h4>
              <div className="grid grid-cols-2 gap-4 text-[10px]">
                <div className="space-y-1.5 p-3 bg-[#08080f]/60 rounded border border-white/5">
                  <span className="text-gray-400 block font-mono">Explainable AI Check:</span>
                  <p className="text-gray-300 font-sans leading-relaxed text-[9px]">
                    System evaluated game-theoretic margins weighing candidate parameter contributions upward or downward overall.
                  </p>
                  <p className="text-emerald-400 font-mono font-bold">{selectedAudit.xaiMetadata?.fairnessCheck}</p>
                </div>

                <div className="space-y-1.5 p-3 bg-[#08080f]/60 rounded border border-white/5">
                  <span className="text-gray-400 block font-mono">Associated Feature Indice Offsets:</span>
                  <div className="space-y-1">
                    {selectedAudit.xaiMetadata?.shapValues.map(s => (
                      <div key={s.feature} className="flex justify-between items-center text-[9px] font-mono text-gray-400">
                        <span className="truncate pr-1">{s.feature}</span>
                        <span className={s.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {s.value >= 0 ? `+${s.value}` : s.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right demographics parity visual charts (Span 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glassmorphism p-6 rounded-[28px] border border-white/10 space-y-5 shadow-lg text-xs leading-relaxed">
            <h3 className="text-xs font-display font-bold text-white flex items-center">
              <Sliders className="w-4 h-4 mr-1.5 text-emerald-400" /> EU AI Act Bias & Demographics Fairness reports
            </h3>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-[#08080f] rounded-lg border border-white/5">
                <span className="text-[8px] font-mono text-gray-500 block uppercase">Overall Fairness Parity</span>
                <span className="text-xl font-display font-black text-emerald-400 mt-1 block">{biasReport.overallFairness}%</span>
                <span className="text-[8px] text-gray-500 font-mono mt-1 block">EEOC Optimum Match Ratio</span>
              </div>

              <div className="p-3 bg-[#08080f] rounded-lg border border-white/5">
                <span className="text-[8px] font-mono text-gray-500 block uppercase">Demographic Variance</span>
                <span className="text-xl font-display font-black text-cyan-400 mt-1 block">{biasReport.demographicParity}</span>
                <span className="text-[8px] text-gray-400 font-mono mt-1 block">Limit Constraint: &lt; 0.1</span>
              </div>
            </div>

            {/* UPGRADED Gender representation pie chart */}
            <div className="space-y-2 border-t border-white/5 pt-4">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-1">Gender Distribution parity ratio</span>
              <div className="h-40 flex items-center justify-center bg-black/20 rounded-2xl border border-white/5 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 10 }} />
                    <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* UPGRADED Age Distribution brackets Chart */}
            <div className="space-y-2 border-t border-white/5 pt-4">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-1">Age Brackets Parity audit</span>
              <div className="h-40 flex items-center justify-center bg-black/20 rounded-2xl border border-white/5 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData}>
                    <XAxis dataKey="range" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 9 }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Active Compliance indications */}
            <div className="p-3 bg-emerald-500/5 rounded border border-emerald-500/20 space-y-1.5 text-[9px] font-sans">
              <div className="flex items-center text-emerald-400 font-mono font-bold">
                <ShieldCheck className="w-4 h-4 mr-1 animate-pulse" /> Active Compliance Clearances
              </div>
              <ul className="space-y-1 text-gray-300 font-sans">
                {biasReport.alerts.map((al, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-emerald-400 mr-1.5 font-bold">•</span>
                    <span>{al}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Perf monitoring healthy states */}
          <div className="glassmorphism p-5 rounded-[24px] border border-white/10 space-y-3.5 shadow-md">
            <h4 className="text-xs font-display font-semibold text-white flex items-center">
              <Server className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> Infrastructure Host Performance Index
            </h4>

            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
              <div className="flex justify-between p-2 bg-[#08080f]/40 border border-white/5 rounded">
                <span className="text-gray-500">KAFKA TOPIC CLUSTERS:</span>
                <span className="text-emerald-400 font-bold">STABLE</span>
              </div>
              <div className="flex justify-between p-2 bg-[#08080f]/40 border border-white/5 rounded">
                <span className="text-gray-500">EVENT OVERALL/SEC:</span>
                <span className="text-gray-300 font-bold">{throughput} msg</span>
              </div>
              <div className="flex justify-between p-2 bg-[#08080f]/40 border border-white/5 rounded">
                <span className="text-gray-500">P95 COMPUTE TIME:</span>
                <span className="text-indigo-400 font-bold">{latency}ms</span>
              </div>
              <div className="flex justify-between p-2 bg-[#08080f]/40 border border-white/5 rounded">
                <span className="text-gray-500">POSTGRES CONNECTIONS:</span>
                <span className="text-gray-300 font-bold">{postgresPool}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
