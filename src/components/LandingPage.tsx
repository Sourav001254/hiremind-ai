/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Sparkles,
  Briefcase,
  Layers,
  Bot,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  LineChart,
  User,
  ShieldAlert,
  ArrowUpRight,
  Workflow
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: (portal: 'recruiter' | 'candidate' | 'admin') => void;
  candidateCount: number;
}

export default function LandingPage({ onEnterApp, candidateCount }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col justify-between py-12 relative overflow-hidden">
      
      {/* Visual Accent Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -z-40 w-[600px] h-[350px] bg-indigo-500/10 rounded-full filter blur-[100px] pointer-events-none neural-pulse" />
      <div className="absolute bottom-1/4 right-10 -z-40 w-[400px] h-[250px] bg-cyan-500/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Top Header Navigation bar */}
      <header className="max-w-6xl w-full mx-auto px-6 flex justify-between items-center z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-violet-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-display font-black text-sm tracking-wide text-white uppercase block">HireMind AI</span>
            <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest block font-medium">Platform v2</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-[9px] font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded text-gray-300 flex items-center">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse mr-1.5" />
            Active Profiles: {candidateCount}
          </span>
          <span className="text-[9px] text-gray-500 font-mono hidden sm:inline">EEOC COMPLIANT // SOC2 SECURITY</span>
        </div>
      </header>

      {/* Central Hero Headline and Entry Cards */}
      <main className="max-w-5xl w-full mx-auto px-6 py-12 flex flex-col justify-center items-center text-center space-y-12">
        
        {/* Cinematic Headline Hero */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 mb-2 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[9px] font-mono uppercase text-indigo-300 font-semibold tracking-wide">
              Autonomous Recruiting Intelligence Command Center
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-white leading-tight">
            Decentralized Hiring, <br />
            Powered by <span className="text-aurora">Autonomous AI Agents</span>
          </h1>

          <p className="text-xs md:text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
            Unify high-throughput LayoutLMv3 document parsers, sentence embeddings, XGBoost ranking ensembles, and EEOC compliance bias monitoring parity into a single spectacular cockpit overview.
          </p>
        </div>

        {/* Modular Gateway Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl pt-6 z-10">
          
          {/* Card 1: Recruiter Command Center */}
          <div
            onClick={() => onEnterApp('recruiter')}
            className="group relative p-7 rounded-[28px] glassmorphism border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition duration-550 cursor-pointer flex flex-col justify-between text-left space-y-8 neon-glow transform hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div className="p-3 bg-indigo-500/15 w-max rounded-xl text-indigo-400 group-hover:bg-indigo-500/25 transition">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-[#f3f4f6] text-sm group-hover:text-white transition flex items-center">
                  Recruiter OS Command Center <ArrowUpRight className="w-3.5 h-3.5 ml-1 text-indigo-400 group-hover:translate-bounce" />
                </h3>
                <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                  Evaluate candidates, analyze SHAP feature waterfall weights, and query standard grounded profiles using the Recruiter RAG Gemini Copilot.
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-[9px] font-mono text-indigo-400 border-t border-white/5 pt-3">
              <span>EXPLORE DASHBOARDS</span>
              <ChevronRight className="w-4.5 h-4.5 translate-x-0 group-hover:translate-x-1.5 transition" />
            </div>
          </div>

          {/* Card 2: Candidate Resume Hub */}
          <div
            onClick={() => onEnterApp('candidate')}
            className="group relative p-7 rounded-[28px] glassmorphism border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition duration-550 cursor-pointer flex flex-col justify-between text-left space-y-8 transform hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div className="p-3 bg-cyan-500/15 w-max rounded-xl text-cyan-400 group-hover:bg-cyan-500/25 transition">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-[#f3f4f6] text-sm group-hover:text-white transition flex items-center">
                  Candidate OS Resume Hub <ArrowUpRight className="w-3.5 h-3.5 ml-1 text-cyan-400" />
                </h3>
                <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                  Paste resume plain vectors, select targeted positions, trigger live Gemini Layout-LM parsed roadmaps, and instantly test compatibility bounds.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center text-[9px] font-mono text-cyan-400 border-t border-white/5 pt-3">
              <span>BEGIN DOCUMENT PARSE</span>
              <ChevronRight className="w-4.5 h-4.5 translate-x-0 group-hover:translate-x-1.5 transition" />
            </div>
          </div>

          {/* Card 3: Admin Compliance Audit Gateway */}
          <div
            onClick={() => onEnterApp('admin')}
            className="group relative p-7 rounded-[28px] glassmorphism border border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5 transition duration-550 cursor-pointer flex flex-col justify-between text-left space-y-8 transform hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div className="p-3 bg-violet-500/15 w-max rounded-xl text-violet-400 group-hover:bg-violet-500/25 transition">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-[#f3f4f6] text-sm group-hover:text-white transition flex items-center">
                  Compliance Audit Gateway <ArrowUpRight className="w-3.5 h-3.5 ml-1 text-violet-400" />
                </h3>
                <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                  Monitor live micro-orchestrator stages, audit system logs carrying XAI SHAP schemas, and review automated ethnic/gender demographic parity parities.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center text-[9px] font-mono text-violet-400 border-t border-white/5 pt-3">
              <span>INSPECT PIPELINE STAGES</span>
              <ChevronRight className="w-4.5 h-4.5 translate-x-0 group-hover:translate-x-1.5 transition" />
            </div>
          </div>

        </div>

        {/* Core Technology Banner line */}
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 pt-6 text-[10px] text-gray-500 font-mono">
          <span className="flex items-center"><Workflow className="w-3.5 h-3.5 text-indigo-400 mr-1.5" /> Kafka Topic Brokers</span>
          <span>•</span>
          <span className="flex items-center"><TrendingUp className="w-3.5 h-3.5 text-cyan-400 mr-1.5" /> XGBoost Neural Ensemble Models</span>
          <span>•</span>
          <span className="flex items-center"><LineChart className="w-3.5 h-3.5 text-violet-400 mr-1.5" /> SHAP/XAI Explainability</span>
        </div>

      </main>

      {/* Cinematic bottom Footer links block */}
      <footer className="max-w-6xl w-full mx-auto px-6 text-center text-[9px] text-gray-500 font-mono tracking-wider pt-6 border-t border-white/5 z-10">
        <div>HIREMIND AI V2 // AUTONOMOUS DECISIONS SYSTEM // ENTERPRISE GRADE RECRUITING 2026 // SOC2 ENCRYPTED</div>
      </footer>

    </div>
  );
}
