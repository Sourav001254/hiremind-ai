/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Candidate {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  email: string;
  score: number;
  skills: { name: string; score: number }[];
  experience: {
    role: string;
    company: string;
    duration: string;
    description: string;
  }[];
  education: {
    degree: string;
    school: string;
    year: string;
  }[];
  atsScore: number;
  matchBreakdown: {
    semantic: number;
    keywords: number;
    overall: number;
  };
  shapValues: {
    feature: string;
    value: number; // positive or negative influence
  }[];
  redFlags: string[];
  fraudScore: number;
  fraudDetails?: {
    suspiciousTimeline: boolean;
    duplicateSuspect: boolean;
    plagiarismDetected: boolean;
    reason: string;
  };
  roadmap: string[];
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  skillsRequired: string[];
  description: string;
}

export interface AgentStatus {
  id: string;
  name: string;
  role: string;
  model: string;
  status: 'idle' | 'processing' | 'active' | 'completed' | 'alert';
  lastLog: string;
  heartbeat: string;
}

export interface SystemEvent {
  id: string;
  timestamp: string;
  topic: string; // e.g. hiremind.resume.uploaded
  status: 'success' | 'warning' | 'error';
  payload: Record<string, any>;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  targetId: string;
  details: string;
  xaiMetadata?: {
    shapValues: { feature: string; value: number }[];
    fairnessCheck: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'system' | 'copilot';
  text: string;
  timestamp: string;
  citations?: { title: string; link?: string; rating?: number }[];
}

export interface BiasReport {
  overallFairness: number; // 0 to 100
  demographicParity: number; // difference indicator (alert if > 0.1)
  genderRepresentation: { male: number; female: number; nonbinary: number };
  ageDistribution: { range: string; count: number }[];
  alerts: string[];
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export interface UnauthenticatedRequest extends Request {
  user?: undefined;
}
