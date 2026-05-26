/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Candidate, Job, AgentStatus, SystemEvent, AuditLogItem, BiasReport } from './types';

export const SAMPLE_JOBS: Job[] = [
  {
    id: "job-1",
    title: "Lead AI/ML Platform Engineer",
    department: "Engineering",
    location: "San Francisco, CA (Hybrid)",
    type: "Full-Time",
    skillsRequired: ["PyTorch", "Python", "Kubernetes", "Transformers", "LLMOps", "FastAPI"],
    description: "Design and maintain high-throughput autonomous LLM routing pipelines and edge model caching infrastructure. Scaled on standard Kubernetes with custom autoscale triggers."
  },
  {
    id: "job-2",
    title: "Senior React Architect",
    department: "Frontend Center of Excellence",
    location: "Remote (US)",
    type: "Full-Time",
    skillsRequired: ["React 19", "Vite", "TypeScript", "Tailwind CSS", "Framer Motion", "Three.js"],
    description: "Create premium cinematic dashboard experiences. Standardize micro-frontend communication layers, fluid glassmorphic styling, and hardware-accelerated user interaction feeds."
  },
  {
    id: "job-3",
    title: "Senior Full Stack Fintech Engineer",
    department: "Platform Core",
    location: "New York, NY (Onsite)",
    type: "Full-Time",
    skillsRequired: ["Node.js", "Express", "PostgreSQL", "Next.js", "Redis", "Kafka", "Docker"],
    description: "Develop secure and compliant bank ledger transaction architectures. Handle event-driven cascades of multi-tenant ledgers with rigorous audit logging mechanisms."
  }
];

export const SAMPLE_CANDIDATES: Candidate[] = [
  {
    id: "cand-1",
    name: "Elena Rostova",
    role: "Senior React Architect",
    email: "elena.rostova@designworks.io",
    score: 94,
    skills: [
      { name: "React 19", score: 98 },
      { name: "TypeScript", score: 95 },
      { name: "Three.js", score: 88 },
      { name: "Vite & Bundlers", score: 92 },
      { name: "Tailwind CSS", score: 96 },
      { name: "Framer Motion", score: 90 }
    ],
    experience: [
      {
        role: "Principal Frontend Engineer",
        company: "Vercel-aligned Lab Services",
        duration: "2023 - Present",
        description: "Optimized server component rendering trees, saving 42% on edge-tier cold boot times. Directed layout orchestration layer for heavy analytics bento boards."
      },
      {
        role: "Senior UI/UX Developer",
        company: "Vortex Gaming Network",
        duration: "2020 - 2023",
        description: "Engineered high-performance WebGL custom dashboards using Three.js and custom shader plugins. Boosted scroll frame rates to consistent 120 FPS."
      }
    ],
    education: [
      {
        degree: "M.S. in Human-Computer Interaction",
        school: "Georgia Institute of Technology",
        year: "2020"
      },
      {
        degree: "B.S. in Computer Science",
        school: "Stanford University",
        year: "2018"
      }
    ],
    atsScore: 95,
    matchBreakdown: {
      semantic: 96,
      keywords: 93,
      overall: 94
    },
    shapValues: [
      { feature: "React 19 Ecosystem Fits", value: 24 },
      { feature: "WebGL/Three.js Expertise", value: 18 },
      { feature: "Vercel Framework Contributor", value: 15 },
      { feature: "Enterprise Experience Years", value: 12 },
      { feature: "Core JavaScript Fundamentals", value: 10 },
      { feature: "Lack of Go Backends (L10 Proxy)", value: -2 }
    ],
    redFlags: [],
    fraudScore: 8,
    fraudDetails: {
      suspiciousTimeline: false,
      duplicateSuspect: false,
      plagiarismDetected: false,
      reason: "No anomalies detected. Valid career pathing verified via automated neural graph."
    },
    roadmap: [
      "Deepen Rust integration layer via WebAssembly for canvas processing",
      "Lead cross-team design systems harmonization",
      "Adopt Server Actions with local cache invalidation"
    ]
  },
  {
    id: "cand-2",
    name: "Marcus Vance",
    role: "Lead AI/ML Platform Engineer",
    email: "m.vance@neuralcloud.ai",
    score: 89,
    skills: [
      { name: "PyTorch", score: 96 },
      { name: "Python 3.12", score: 98 },
      { name: "Kubernetes", score: 91 },
      { name: "Transformers", score: 94 },
      { name: "LLMOps Pipeline", score: 87 },
      { name: "FastAPI", score: 93 }
    ],
    experience: [
      {
        role: "ML Platform Team Lead",
        company: "Synthesia Core AI",
        duration: "2022 - Present",
        description: "Coordinated containerized rollout strategy for fine-tuned LLM ensembles. Successfully automated Pinecone cluster synchronization hooks on daily events."
      },
      {
        role: "AI Core Research Associate",
        company: "OpenAI Labs Platform",
        duration: "2019 - 2022",
        description: "Devised distributed training orchestrators on AWS clusters. Handled large embeddings alignment matrices and document parsers optimizations."
      }
    ],
    education: [
      {
        degree: "Ph.D. in Computer Science (Deep Learning focus)",
        school: "Massachusetts Institute of Technology",
        year: "2019"
      }
    ],
    atsScore: 88,
    matchBreakdown: {
      semantic: 92,
      keywords: 84,
      overall: 89
    },
    shapValues: [
      { feature: "Tensor/PyTorch Core Expert", value: 25 },
      { feature: "MIT Ph.D. Direct Alignment", value: 20 },
      { feature: "Kubernetes Custom Operator Hook", value: 16 },
      { feature: "Pinecone / Vector db design", value: 14 },
      { feature: "Salary Range Premium Anchor", value: -6 }
    ],
    redFlags: ["High expected range skew"],
    fraudScore: 12,
    fraudDetails: {
      suspiciousTimeline: false,
      duplicateSuspect: false,
      plagiarismDetected: false,
      reason: "Consistent academic peer reviews and active personal github repos authenticated."
    },
    roadmap: [
      "Master edge weight compression architectures via post-quantization",
      "Integrate Triton server pipelines to reduce inferencing cost",
      "Initiate federated privacy-first training loops"
    ]
  },
  {
    id: "cand-3",
    name: "Liam Chen",
    role: "Senior Full Stack Fintech Engineer",
    email: "l.chen.developer@cryptocore.io",
    score: 78,
    skills: [
      { name: "Node.js", score: 88 },
      { name: "PostgreSQL", score: 92 },
      { name: "Next.js", score: 85 },
      { name: "Redis Streams", score: 82 },
      { name: "Kafka Brokers", score: 90 },
      { name: "Docker Compose", score: 87 }
    ],
    experience: [
      {
        role: "Full Stack Engineer",
        company: "Coinbase Ledger Infrastructure",
        duration: "2024 - Present",
        description: "Constructed asynchronous Kafka event streams processing ledger updates. Refined database lock profiles on multi-tenant indexes."
      },
      {
        role: "Senior Backend Developer",
        company: "Apex Clearing Systems",
        duration: "2022 - 2023",
        description: "Implemented high-performance web ledger microservices utilizing Express. Designed real-time monitoring graphs with Socket.io."
      }
    ],
    education: [
      {
        degree: "B.S. in Computer Science",
        school: "University of Waterloo",
        year: "2022"
      }
    ],
    atsScore: 82,
    matchBreakdown: {
      semantic: 80,
      keywords: 85,
      overall: 82
    },
    shapValues: [
      { feature: "High-Frequency Ledger Designs", value: 18 },
      { feature: "Kafka Topic Handlers Contributor", value: 15 },
      { feature: "Waterloo CS Alumnus Match", value: 12 },
      { feature: "Short tenure gaps skew", value: -14 },
      { feature: "PII masking non-compliance alert", value: -3 }
    ],
    redFlags: ["Short employment stints < 8 months", "Duplicate platform profiles flagged"],
    fraudScore: 72,
    fraudDetails: {
      suspiciousTimeline: true,
      duplicateSuspect: true,
      plagiarismDetected: false,
      reason: "Multi-tenant engine flagged identical resume outline in external firm sandbox. Potential duplicate recruiter application spam detected."
    },
    roadmap: [
      "Implement SOC2 type II encryption pipelines across distributed logs",
      "Increase persistence profiles on Redis Cache",
      "Adopt strict standard design pattern definitions to avoid churn"
    ]
  }
];

export const INITIAL_AGENTS: AgentStatus[] = [
  {
    id: "agent-1",
    name: "Resume Intelligence",
    role: "Document Understanding & NER Extraction",
    model: "LayoutLMv3 base + custom spaCy",
    status: "idle",
    lastLog: "Standby active. Listened for resume.uploaded events. Pipeline optimized.",
    heartbeat: "Active (2s ago)"
  },
  {
    id: "agent-2",
    name: "ATS Matching Engine",
    role: "Vector Embedding Core Alignment",
    model: "SentenceTransformers all-MiniLM-L6-v2",
    status: "idle",
    lastLog: "Evaluated distance matrices for standard embeddings successfully.",
    heartbeat: "Active (4s ago)"
  },
  {
    id: "agent-3",
    name: "Ranking Ensemble",
    role: "ML Feature Calibration & SHAP Generation",
    model: "XGBoost + Neural Layer ensemble",
    status: "idle",
    lastLog: "Computed SHAP feature vectors for the latest candidate portfolio updates.",
    heartbeat: "Active (5s ago)"
  },
  {
    id: "agent-4",
    name: "Interview intelligence",
    role: "Dynamic Q-Gen & Cognitive Parsing",
    model: "Gemini 3.5 Flash (for question paths)",
    status: "idle",
    lastLog: "Generated customized technical gap questions for Liam Chen.",
    heartbeat: "Active (12s ago)"
  },
  {
    id: "agent-5",
    name: "Recruiter Copilot (RAG)",
    role: "Natural Language Recruiter Interface",
    model: "Gemini 3.5 Flash (RAG Pipeline)",
    status: "idle",
    lastLog: "Indexed candidate profiles into vector semantic blocks successfully.",
    heartbeat: "Active (1s ago)"
  },
  {
    id: "agent-6",
    name: "Fraud Risk Inspector",
    role: "MinHash LSH & IsolationForest checking",
    model: "IsolationForest (anomaly thresholds)",
    status: "idle",
    lastLog: "Audit complete. Profile duplications updated. Flagged candidate cand-3.",
    heartbeat: "Active (8s ago)"
  },
  {
    id: "agent-7",
    name: "Analytics Core",
    role: "Hiring Funnel Time-to-Hire Prophet Models",
    model: "FB Prophet + scikit-learn",
    status: "idle",
    lastLog: "Snapshot saved. Recruiter hiring performance aggregates updated.",
    heartbeat: "Active (14s ago)"
  },
  {
    id: "agent-8",
    name: "Recommendation Advisor",
    role: "Collaborative Filtering Engine",
    model: "Pincone ANN Search Engine",
    status: "idle",
    lastLog: "Refined recommended roles based on previous recruiter acceptance records.",
    heartbeat: "Active (20s ago)"
  }
];

export const INITIAL_EVENTS: SystemEvent[] = [
  {
    id: "evt-101",
    timestamp: "19:04:12",
    topic: "hiremind.resume.uploaded",
    status: "success",
    payload: { filename: "Elena_cv_2026.pdf", org_id: "org-alpha-99", size_bytes: 409110 }
  },
  {
    id: "evt-102",
    timestamp: "19:04:14",
    topic: "hiremind.resume.parsed",
    status: "success",
    payload: { candidate_name: "Elena Rostova", skills_found: ["React", "TypeScript", "Three.js"] }
  },
  {
    id: "evt-103",
    timestamp: "19:04:15",
    topic: "hiremind.candidate.ranked",
    status: "success",
    payload: { candidate_id: "cand-1", rank: 1, overall_score: 94 }
  },
  {
    id: "evt-104",
    timestamp: "19:05:32",
    topic: "hiremind.resume.uploaded",
    status: "success",
    payload: { filename: "Liam_dev_cv.pdf", org_id: "org-alpha-99" }
  },
  {
    id: "evt-105",
    timestamp: "19:05:35",
    topic: "hiremind.fraud.detected",
    status: "warning",
    payload: { candidate_id: "cand-3", duplication_match: "95%", source_org: "recruiter-beta-hub" }
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: "aud-401",
    timestamp: "19:04:15 UTC",
    action: "RANKING_DECISION",
    actor: "Ranking Ensemble Agent",
    targetId: "cand-1",
    details: "Assigned rank #1 on job-2. SHAP feature values written. Demographics flag: OK.",
    xaiMetadata: {
      shapValues: [
        { feature: "React 19 Ecosystem Fits", value: 24 },
        { feature: "WebGL/Three.js Expertise", value: 18 }
      ],
      fairnessCheck: "Bias parity deviation = 0.02 (Optimal)"
    }
  },
  {
    id: "aud-402",
    timestamp: "19:05:35 UTC",
    action: "FRAUD_ALERT_RAISED",
    actor: "Fraud Risk Inspector",
    targetId: "cand-3",
    details: "Suspicious metadata overlap found with candidate Liam Chen resume inputs. Plagiarism algorithm verified.",
    xaiMetadata: {
      shapValues: [
        { feature: "Duplicate resume suspect", value: 25 },
        { feature: "Short tenure gaps skew", value: -14 }
      ],
      fairnessCheck: "Security overrides active. Parity metrics bypass safe."
    }
  }
];

export const MOCK_BIAS_REPORT: BiasReport = {
  overallFairness: 98,
  demographicParity: 0.03, // excellent, < 0.1 limit
  genderRepresentation: { male: 42, female: 52, nonbinary: 6 },
  ageDistribution: [
    { range: "20-25", count: 12 },
    { range: "26-35", count: 48 },
    { range: "36-45", count: 32 },
    { range: "46+", count: 8 }
  ],
  alerts: [
    "Gender representation balance: Optimum parity achieved.",
    "No ethnic or location-based clusters found above standard standard deviations.",
    "Safe parity metrics validated under European AI Act and EEOC compliance parameters."
  ]
};
