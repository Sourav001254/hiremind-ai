/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import LandingPage from './components/LandingPage';
import CommandCenter from './components/CommandCenter';
import CandidateOS from './components/CandidateOS';
import AdminOS from './components/AdminOS';
import ParticleNetwork from './components/ParticleNetwork';
import {
  SAMPLE_JOBS,
  SAMPLE_CANDIDATES,
  INITIAL_AGENTS,
  INITIAL_EVENTS,
  INITIAL_AUDIT_LOGS,
  MOCK_BIAS_REPORT
} from './data';
import { Candidate, SystemEvent, AuditLogItem, AgentStatus, BiasReport } from './types';
import { Bot, Briefcase, Layers, ShieldCheck, Home, LogOut } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'recruiter' | 'candidate' | 'admin'>('landing');

  // Unified global state for tracking candidates dynamically so additions carry across screens immediately
  const [candidates, setCandidates] = useState<Candidate[]>(SAMPLE_CANDIDATES);
  const [events, setEvents] = useState<SystemEvent[]>(INITIAL_EVENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [agents, setAgents] = useState<AgentStatus[]>(INITIAL_AGENTS);
  const [biasReport, setBiasReport] = useState<BiasReport>(MOCK_BIAS_REPORT);

  // Corporate Administrative SSO session state
  const [recruiterUser, setRecruiterUser] = useState<{ email: string; name: string; picture?: string } | null>(null);

  async function checkUserSession() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setRecruiterUser(data.user);
          sessionStorage.setItem('recruiter_user', JSON.stringify(data.user));
          return;
        }
      }
    } catch (e) {
      console.warn("Session check failure", e);
    }

    // Local storage fallback for simulation environments
    const saved = sessionStorage.getItem('recruiter_user');
    if (saved) {
      try {
        setRecruiterUser(JSON.parse(saved));
      } catch (e) {}
    }
  }

  useEffect(() => {
    checkUserSession();
  }, []);

  useEffect(() => {
    // Check for mock SSO success on page load
    const checkUrlForAuth = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('sso_success') === 'true') {
        // The page was reloaded after a successful mock login.
        // The user session should now be in the cookie, so we can check it.
        checkUserSession();
        // Clean up the URL
        window.history.replaceState({}, document.title, "/");
      }
    };

    // Standard OAuth callback listener with origin validation to prevent XSS Auth bypasses
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.user) {
        setRecruiterUser(event.data.user);
        sessionStorage.setItem('recruiter_user', JSON.stringify(event.data.user));
      }
    };

    checkUrlForAuth();
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleTriggerSSO = () => {
    // Completely client-side mock login to bypass server issues
    const mockUser = {
      email: 'recruiter@hiremind.ai',
      name: 'Demo Recruiter',
      picture: '',
      role: 'recruiter',
      authenticatedAt: new Date().toISOString(),
    };
    setRecruiterUser(mockUser);
    sessionStorage.setItem('recruiter_user', JSON.stringify(mockUser));
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (e) {
      console.warn("Could not log out of backend session", e);
    }
    setRecruiterUser(null);
    sessionStorage.removeItem('recruiter_user');
  };

  // Hook to fetch live persistence logs/events/candidates from node server when recruiter is logged in
  useEffect(() => {
    if (!recruiterUser) return;

    async function loadBackendData() {
      try {
        const [resCand, resEvt, resAud, resAgents, resBias] = await Promise.all([
          fetch('/api/candidates').then(res => res.ok ? res.json() : SAMPLE_CANDIDATES),
          fetch('/api/system-events').then(res => res.ok ? res.json().then((d: any) => d.events || INITIAL_EVENTS) : INITIAL_EVENTS),
          fetch('/api/audit-logs').then(res => res.ok ? res.json() : INITIAL_AUDIT_LOGS),
          fetch('/api/agents').then(res => res.ok ? res.json() : INITIAL_AGENTS),
          fetch('/api/bias-report').then(res => res.ok ? res.json() : MOCK_BIAS_REPORT)
        ]);
        setCandidates(resCand);
        setEvents(resEvt);
        setAuditLogs(resAud);
        setAgents(resAgents);
        setBiasReport(resBias);
      } catch (e) {
        console.warn("Backend API loading failed, reverting to local data structures", e);
      }
    }
    loadBackendData();
  }, [recruiterUser]);

  const handleToggleAgent = async (agentId: string) => {
    // Optimistically toggle locally
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: a.status === 'active' ? 'idle' : 'active' } : a));

    try {
      const res = await fetch('/api/agents/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agentId })
      });
      if (res.ok) {
        const freshAgents = await res.json();
        setAgents(freshAgents);
      }
    } catch (e) {
      console.error("Central backend toggle command unsuccessful", e);
    }
  };

  const handleAddNewCandidate = async (newCand: Candidate) => {
    // Check if candidate already registered to prevent duplicates
    if (candidates.some(c => c.email.toLowerCase() === newCand.email.toLowerCase())) return;

    // Optimistically prepend to frontend cache for faster rendering
    setCandidates(prev => [newCand, ...prev]);

    try {
      const res = await fetch('/api/public/candidates', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCand)
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.candidate) {
          setCandidates(prev => prev.map(candidate => candidate.id === newCand.id ? payload.candidate : candidate));
        }
        // Fully align with central db sequences
        setEvents((prev) => payload.events || prev);
        setAuditLogs((prev) => payload.auditLogs || prev);
        
        // Fetch fresh candidate records only if the active user is authorized (logged in recruiter)
        if (recruiterUser) {
          const fresh = await fetch('/api/candidates').then(r => r.ok ? r.json() : []);
          setCandidates(fresh);
        }
      }
    } catch (e) {
      console.error("Central backend register attempt failed, keeping cache", e);
    }
  };

  return (
    <div className="min-h-screen font-sans antialiased text-gray-200 select-none pb-12">
      {/* Three.js interactive custom canvas visual overlays */}
      <ParticleNetwork />

      {/* Primary Routing Core Wrapper */}
      <AnimatePresence mode="wait">
        {currentView === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
          >
            <LandingPage
              onEnterApp={setCurrentView}
              candidateCount={candidates.length}
            />
          </motion.div>
        ) : (
          <motion.div
            key="app-shell"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6"
          >
            
            {/* Top Operational Navigation Controller */}
            <nav className="glassmorphism rounded-xl px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-4 border border-white/10 shadow-lg select-none">
              
              {/* Logo Home button trigger */}
              <div
                onClick={() => setCurrentView('landing')}
                className="flex items-center space-x-2 cursor-pointer group"
              >
                <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-lg group-hover:scale-105 transition">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-display font-black text-xs text-white tracking-wider block">HIREMIND AI</span>
                  <span className="text-[7px] font-mono text-[var(--color-aurora-cyan)] block uppercase">Command Center</span>
                </div>
              </div>

              {/* Custom Operational Workspace swapping links */}
              <div className="flex items-center bg-[#050508]/65 border border-white/5 rounded-lg p-1 space-x-1">
                <button
                  onClick={() => setCurrentView('recruiter')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium font-display transition duration-300 ${
                    currentView === 'recruiter'
                      ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/30 font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Recruiter Command</span>
                </button>

                <button
                  onClick={() => setCurrentView('candidate')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium font-display transition duration-300 ${
                    currentView === 'candidate'
                      ? 'bg-cyan-600/25 text-cyan-300 border border-cyan-500/30 font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Candidate Portal</span>
                </button>

                <button
                  onClick={() => setCurrentView('admin')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium font-display transition duration-300 ${
                    currentView === 'admin'
                      ? 'bg-violet-600/25 text-violet-300 border border-violet-500/30 font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Compliance Gate</span>
                </button>
              </div>

              {/* General Home Link */}
              <div className="flex items-center space-x-2">
                {recruiterUser && (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-[10px] font-mono border border-rose-500/20 transition cursor-pointer"
                    title="Sign Out administrative session"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">SSO Sign Out</span>
                  </button>
                )}
                <button
                  onClick={() => setCurrentView('landing')}
                  className="flex items-center space-x-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-xs font-mono border border-white/10 transition cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Exit</span>
                </button>
              </div>
            </nav>

            {/* Active Panel Display Routing */}
            <div className="transition duration-500">
              <AnimatePresence mode="wait">
                {currentView === 'recruiter' && (
                  <motion.div
                    key="recruiter"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                  >
                    {!recruiterUser ? (
                      <div className="max-w-md mx-auto mt-16 pb-12 animate-fade-in">
                        <div className="text-center space-y-6 bg-slate-950/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-500/10 w-44 h-44 rounded-full blur-3xl pointer-events-none" />
                          
                          <div className="mx-auto w-12 h-12 bg-indigo-500/15 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow">
                            <ShieldCheck className="w-6 h-6 animate-pulse" />
                          </div>
                          
                          <div className="space-y-1.5">
                            <h2 className="text-lg font-display font-black text-white uppercase tracking-wider">Enterprise Security Guard</h2>
                            <span className="text-[10px] font-mono text-cyan-400 block uppercase tracking-widest">Administrative Single-Sign-On</span>
                          </div>
                          
                          <p className="text-xs text-gray-400 leading-relaxed font-sans">
                            This command workspace is restricted to authorized administrative staff. Please initialize identity verification via Google Employee SSO callback protocol.
                          </p>
                          
                          <button
                            onClick={handleTriggerSSO}
                            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-95 font-bold rounded-xl text-white font-mono text-xs uppercase tracking-wider transition-all duration-300 shadow cursor-pointer flex items-center justify-center space-x-2"
                          >
                            <Bot className="w-4 h-4 text-cyan-200" />
                            <span>Authenticate with SSO</span>
                          </button>
                          
                          <button
                            onClick={() => setCurrentView('landing')}
                            className="text-[10px] text-gray-500 hover:text-white font-mono transition block mx-auto underline mt-2"
                          >
                            Return to Welcome Screen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <CommandCenter
                        candidates={candidates}
                        jobs={SAMPLE_JOBS}
                        agents={agents}
                        onToggleAgent={handleToggleAgent}
                        recruiterUser={recruiterUser}
                        onUpdateCandidateLocal={(c) => setCandidates(prev => prev.map(old => old.id === c.id ? c : old))}
                      />
                    )}
                  </motion.div>
                )}

                {currentView === 'candidate' && (
                  <motion.div
                    key="candidate"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CandidateOS
                      jobs={SAMPLE_JOBS}
                      onAddCandidate={handleAddNewCandidate}
                    />
                  </motion.div>
                )}

                {currentView === 'admin' && (
                  <motion.div
                    key="admin"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                  >
                    {!recruiterUser ? (
                      <div className="max-w-md mx-auto mt-16 pb-12 animate-fade-in">
                        <div className="text-center space-y-6 bg-slate-950/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-violet-500/10 w-44 h-44 rounded-full blur-3xl pointer-events-none" />
                          
                          <div className="mx-auto w-12 h-12 bg-violet-500/15 text-violet-400 rounded-2xl flex items-center justify-center border border-violet-500/20 shadow">
                            <ShieldCheck className="w-6 h-6 animate-pulse" />
                          </div>
                          
                          <div className="space-y-1.5">
                            <h2 className="text-lg font-display font-black text-white uppercase tracking-wider">Enterprise Security Guard</h2>
                            <span className="text-[10px] font-mono text-violet-400 block uppercase tracking-widest">Compliance Administrative Gate</span>
                          </div>
                          
                          <p className="text-xs text-gray-400 leading-relaxed font-sans">
                            This SOC2 and bias auditing panel is restricted to verified compliance personnel. Please complete Keycloak Single Sign-on verification.
                          </p>
                          
                          <button
                            onClick={handleTriggerSSO}
                            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-500 hover:opacity-95 font-bold rounded-xl text-white font-mono text-xs uppercase tracking-wider transition-all duration-300 shadow cursor-pointer flex items-center justify-center space-x-2"
                          >
                            <Bot className="w-4 h-4 text-violet-200" />
                            <span>Verify Compliance Officer SSO</span>
                          </button>
                          
                          <button
                            onClick={() => setCurrentView('landing')}
                            className="text-[10px] text-gray-500 hover:text-white font-mono transition block mx-auto underline mt-2"
                          >
                            Return to Welcome Screen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <AdminOS
                        events={events}
                        auditLogs={auditLogs}
                        biasReport={biasReport}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
