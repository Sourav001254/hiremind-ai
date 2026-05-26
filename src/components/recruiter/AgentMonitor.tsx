/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Activity } from 'lucide-react';
import { AgentStatus } from '../../types';

interface AgentMonitorProps {
  agents: AgentStatus[];
  onToggleAgent?: (id: string) => void;
}

export default function AgentMonitor({
  agents,
  onToggleAgent,
}: AgentMonitorProps) {
  const getStatusColor = (st: string) => {
    if (st === 'processing') return 'bg-cyan-400 text-cyan-400';
    if (st === 'alert') return 'bg-rose-500 text-rose-500';
    return 'bg-emerald-500 text-emerald-500';
  };

  return (
    <div className="glassmorphism p-5 rounded-[28px] border border-white/10 space-y-3 shadow-md">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-display font-semibold text-white flex items-center">
          <Activity className="w-3.5 h-3.5 mr-1.5 text-cyan-400 animate-pulse" /> Layer 7 Agent Fleet Indicators
        </h4>
        <span className="text-[8px] font-mono text-emerald-400 animate-pulse">● Live updates active</span>
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
        {agents.map((agent) => (
          <div
            key={agent.id}
            onClick={() => onToggleAgent && onToggleAgent(agent.id)}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[9px] space-y-1 cursor-pointer hover:border-cyan-500/40 hover:bg-white/[0.08] active:scale-95 transition-all duration-200"
            title="Click to toggle agent status"
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-200 truncate pr-1">{agent.name}</div>
              <div className="flex items-center">
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(agent.status)} animate-pulse mr-1`} />
                <span className="text-[8px] opacity-75 font-mono text-gray-400 whitespace-nowrap">
                  {agent.status}
                </span>
              </div>
            </div>
            <div className="text-[8px] text-gray-400 truncate font-mono">{agent.lastLog}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
