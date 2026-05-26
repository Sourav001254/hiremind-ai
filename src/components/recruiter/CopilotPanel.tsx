/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import { Bot, Send, Sparkle } from 'lucide-react';
import { Candidate, Job, ChatMessage } from '../../types';

interface CopilotPanelProps {
  candidates: Candidate[];
  jobs: Job[];
  onAgentActivity?: (id: string, status: 'idle' | 'processing' | 'active' | 'completed' | 'alert', log: string) => void;
}

export default function CopilotPanel({
  candidates,
  jobs,
  onAgentActivity,
}: CopilotPanelProps) {
  const [copilotHistory, setCopilotHistory] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'copilot',
      text: "Greetings. I am your autonomous recruiter intelligence copilot. I am actively grounded on Elena, Marcus, and Liam's multi-tenant profiles. Ask me to compare candidates, summarize careers, or explain scoring calculations.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [copilotHistory]);

  const handleCopilotSubmit = async (e?: FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const messageToSend = customPrompt || userInput;
    if (!messageToSend.trim() || isCopilotLoading) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setCopilotHistory((prev) => [...prev, userMsg]);
    setUserInput('');
    setIsCopilotLoading(true);

    if (onAgentActivity) {
      onAgentActivity('agent-5', 'processing', 'Formulating prompt embedding constraints...');
    }

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          history: copilotHistory,
          candidates,
          jobs,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const copilotMsg: ChatMessage = {
          id: `copilot-${Date.now()}`,
          sender: 'copilot',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citations: data.citations,
        };
        setCopilotHistory((prev) => [...prev, copilotMsg]);
      } else {
        throw new Error(data.error || 'Copilot interface returned an output discrepancy.');
      }
    } catch (err: any) {
      console.error('Central Copilot Chat Error:', err);
      const errorMessage = `⚠️ Connection Failure: The Recruiter Copilot was unable to complete this query successfully.

This occurs when the backend server is offline, your session cookie expired, or the internal GEMINI_API_KEY has not been configured in your secrets.

Please verify your single sign-on security access or contact your platform administrator.

Error Details: ${err.message || err}`;

      const copilotErrorMsg: ChatMessage = {
        id: `copilot-error-${Date.now()}`,
        sender: 'copilot',
        text: errorMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: [],
      };
      setCopilotHistory((prev) => [...prev, copilotErrorMsg]);
    } finally {
      setIsCopilotLoading(false);
      if (onAgentActivity) {
        onAgentActivity('agent-5', 'idle', 'Orchestrated prompt answer compiled.');
      }
    }
  };

  return (
    <div className="glassmorphism rounded-[28px] border border-white/10 flex flex-col h-[540px] overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-b from-indigo-500/5 to-transparent">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-white text-xs">Recruiter Copilot</h3>
            <span className="text-[8px] text-gray-400 block font-mono">MODEL: GEMINI-3.5-FLASH</span>
          </div>
        </div>
        <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono">
          Knowledge Gaps RAG Link
        </span>
      </div>

      {/* Chat Messages */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {copilotHistory.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="text-[10px] text-gray-500 font-mono mb-1">
              {msg.sender === 'user' ? 'Recruiter Taskforce' : 'Copilot Neural Engine'} • {msg.timestamp}
            </div>

            <div
              className={`p-3 rounded-lg text-[10px] leading-relaxed max-w-[95%] font-sans whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-indigo-600/25 text-gray-100 border border-indigo-500/30 font-semibold'
                  : 'bg-white/5 text-gray-300 border border-white/5'
              }`}
            >
              {msg.text}

              {/* Grounded Citation Badges */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="flex gap-2.5 mt-3 pt-2.5 border-t border-white/5 flex-wrap">
                  {msg.citations.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center space-x-1.5 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[8px] font-mono"
                    >
                      <Sparkle className="w-2.5 h-2.5 text-cyan-400" />
                      <span>
                        {c.title} ({c.rating}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isCopilotLoading && (
          <div className="flex flex-col items-start">
            <span className="text-[8px] text-indigo-400 font-mono animate-pulse">
              L7 Recruiter Agent Pipeline is querying...
            </span>
            <div className="bg-white/5 rounded-lg p-3 text-[10px] text-gray-500 border border-white/5 flex items-center space-x-1.5 animate-pulse mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping mr-1" />
              <span>Analyzing target profiles context constraints...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Inquiry Buttons Panel */}
      <div className="p-2 bg-black/20 border-t border-white/5 flex flex-wrap gap-1.5">
        <span className="text-[8px] text-gray-500 font-mono block w-full pl-1">QUICK INQUIRY:</span>
        <button
          onClick={() => handleCopilotSubmit(undefined, 'Who is the strongest Candidate for Senior React Architect?')}
          className="text-[8px] font-mono text-indigo-300 bg-[#08080f] hover:border-indigo-500/30 transition border border-white/5 px-2 py-1 rounded cursor-pointer"
        >
          Find Top Frontend Partner
        </button>
        <button
          onClick={() => handleCopilotSubmit(undefined, 'Compare Elena vs Liam')}
          className="text-[8px] font-mono text-indigo-300 bg-[#08080f] hover:border-indigo-500/30 transition border border-white/5 px-2 py-1 rounded cursor-pointer"
        >
          Compare Elena vs Liam
        </button>
        <button
          onClick={() => handleCopilotSubmit(undefined, 'Who has active fraud alerts?')}
          className="text-[8px] font-mono text-indigo-300 bg-[#08080f] hover:border-indigo-500/30 transition border border-white/5 px-2 py-1 rounded cursor-pointer"
        >
          Check Duplicity Fraud Gaps
        </button>
      </div>

      {/* Message Input Controls */}
      <form onSubmit={handleCopilotSubmit} className="p-3 border-t border-white/5 flex space-x-2">
        <input
          type="text"
          placeholder="Ask intelligence copilot..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="flex-1 bg-[#08080f] text-gray-200 placeholder-gray-500 text-xs rounded-lg px-3 py-2 border border-white/5 focus:border-indigo-500/50 outline-none transition"
        />
        <button
          type="submit"
          disabled={isCopilotLoading}
          className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
