/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Upload,
  Sparkles,
  FileText,
  Compass,
  GraduationCap,
} from 'lucide-react';
import { Candidate, Job } from '../types';

interface CandidateOSProps {
  jobs: Job[];
  onAddCandidate: (newCand: Candidate) => void;
}

export default function CandidateOS({ jobs, onAddCandidate }: CandidateOSProps) {
  const [selectedJob, setSelectedJob] = useState<Job>(jobs[0]);
  const [resumeText, setResumeText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedCandidate, setParsedCandidate] = useState<Candidate | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [parsingError, setParsingError] = useState('');

  const SAMPLE_RESUMES = {
    fullstack: `Siddharth Patel
siddharth.dev@gmail.com
Senior Full Stack Engineer
Key Skills: React, Node.js, Express, Mongo, Tailwind CSS, Vite.
Experience:
- Core Technologist at Paytm Payments Lab (2024 - Present)
Created modern React financial ledgers backend microservices, optimized state.
- Software Engineer at Infosys Center (2022 - 2024)
Designed responsive client web interface widgets.`,
    ai_eng: `Amelia Vance
amelia@cybernetics.io
ML Platform Researcher
Key Skills: PyTorch, Python, LLMOps, FastAPI, Kubernetes, Transformers, HuggingFace.
Education: M.S. in Machine Learning from Carnegie Mellon (2023).
Experience:
- ML Intern at Nvidia (2024 - Present). Built parallelized tensor routing controllers.`,
  };

  const handleParse = async (customText?: string) => {
    const textToParse = customText || resumeText;
    if (!textToParse.trim() || isParsing) {
      return;
    }

    setIsParsing(true);
    setParsedCandidate(null);
    setUploadedFileName('');
    setParsingError('');

    try {
      const response = await fetch('/api/public/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: textToParse,
          jobTitle: selectedJob.title,
        }),
      });

      const parsedData = await response.json();
      if (!response.ok) {
        throw new Error(parsedData.error || 'Unable to parse resume text.');
      }

      const finalCandidate: Candidate = {
        ...parsedData,
        id: parsedData.id || `parsed-${Date.now()}`,
        score: parsedData.score || 85,
      };

      setParsedCandidate(finalCandidate);
      onAddCandidate(finalCandidate);
    } catch (err: any) {
      setParsingError(err.message || 'Parsing sequence failed.');
    } finally {
      setIsParsing(false);
    }
  };

  const handlePdfUpload = async (file: File) => {
    if (!file || isParsing) {
      return;
    }

    setIsParsing(true);
    setParsedCandidate(null);
    setUploadedFileName(file.name);
    setParsingError('');

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobTitle', selectedJob.title);

    try {
      const response = await fetch('/api/public/candidates/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Server rejected resume extraction.');
      }

      const finalCandidate: Candidate = {
        ...data.candidate,
        id: data.candidate.id || `parsed-${Date.now()}`,
      };

      setParsedCandidate(finalCandidate);
      onAddCandidate(finalCandidate);
    } catch (err: any) {
      setParsingError(err.message || 'Direct PDF understanding failed.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleTemplateSelect = (key: 'fullstack' | 'ai_eng') => {
    const text = SAMPLE_RESUMES[key];
    setResumeText(text);
    handleParse(text);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 space-y-4">
        <div className="glassmorphism p-6 rounded-[28px] border border-white/10 space-y-5 shadow-lg">
          <div>
            <h2 className="text-base font-display font-bold text-white flex items-center">
              <Upload className="w-5 h-5 text-indigo-400 mr-2 animate-bounce" /> Resume OS Parser
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Upload a PDF or paste resume text. We will parse it, score it, and save the submission for recruiter review.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-gray-400 block uppercase">Select Target Position</label>
            <select
              value={selectedJob.id}
              onChange={(e) => setSelectedJob(jobs.find((job) => job.id === e.target.value) || jobs[0])}
              className="w-full bg-[#050508] border border-white/5 rounded-lg text-xs p-2.5 text-gray-300 focus:border-indigo-500 outline-none"
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-gray-400 block uppercase">Option A: Direct PDF Upload</span>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                const file = event.dataTransfer.files?.[0];
                if (!file) {
                  return;
                }
                if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                  handlePdfUpload(file);
                } else {
                  setParsingError('Only PDF files are accepted.');
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition relative hover:bg-white/[0.02] flex flex-col items-center justify-center space-y-2 ${
                dragOver ? 'border-cyan-400 bg-cyan-950/20' : 'border-white/15'
              }`}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    handlePdfUpload(file);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileText className={`w-8 h-8 ${dragOver ? 'text-cyan-400 animate-pulse' : 'text-indigo-400'}`} />
              <div className="text-[11px]">
                <span className="text-indigo-300 font-bold hover:underline">Click to browse</span> or drag and drop your PDF resume
              </div>
              <span className="text-[8px] text-gray-500 uppercase font-mono">PDF files up to 10MB accepted</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-gray-400 block uppercase">Option B: Input Raw Resume Text</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleTemplateSelect('fullstack')}
                  className="text-[8px] font-mono text-indigo-300 hover:text-indigo-200 cursor-pointer"
                >
                  [Load FullStack]
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateSelect('ai_eng')}
                  className="text-[8px] font-mono text-cyan-300 hover:text-cyan-200 cursor-pointer"
                >
                  [Load AI]
                </button>
              </div>
            </div>

            <textarea
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              placeholder="Paste plain resume text here..."
              rows={5}
              className="w-full bg-[#050508] border border-white/5 rounded-lg text-[10px] p-3 text-gray-300 font-mono focus:border-indigo-500/50 outline-none transition"
            />
          </div>

          {parsingError && (
            <div className="p-3.5 rounded bg-rose-500/5 border border-rose-500/10 text-[9px] font-mono text-rose-400 leading-relaxed">
              Warning: {parsingError}
            </div>
          )}

          {uploadedFileName && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[9px] font-mono text-emerald-400 truncate">
              Uploaded file: {uploadedFileName}
            </div>
          )}

          <button
            onClick={() => handleParse()}
            disabled={isParsing || !resumeText.trim()}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isParsing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                <span className="font-mono text-[10px]">Processing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Parse and Submit Resume</span>
              </>
            )}
          </button>
        </div>

        <div className="glassmorphism p-5 rounded-[24px] border border-white/10 space-y-3 shadow-md">
          <h4 className="text-xs font-display font-semibold text-white flex items-center">
            <Compass className="w-4 h-4 text-cyan-400 mr-2" /> Target Job Alignment Requirements
          </h4>
          <div className="space-y-2 text-[10px] bg-[#08080f]/50 p-3 rounded border border-white/5">
            <div className="font-bold text-gray-200">{selectedJob.title}</div>
            <p className="text-gray-400 leading-relaxed text-[9px]">{selectedJob.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-[8px] font-mono text-gray-500 uppercase self-center mr-1">Required Skills:</span>
              {selectedJob.skillsRequired.map((skill) => (
                <span key={skill} className="text-[8px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded font-mono border border-indigo-500/20">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7">
        {parsedCandidate ? (
          <div className="glassmorphism p-6 rounded-[28px] border border-white/10 space-y-6 animate-fade-in shadow-xl">
            <div className="flex items-start justify-between border-b border-white/5 pb-4">
              <div>
                <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono uppercase block w-max mb-1">
                  Submission Saved
                </span>
                <h3 className="text-lg font-display font-extrabold text-white">{parsedCandidate.name}</h3>
                <span className="text-xs font-mono text-gray-400">{parsedCandidate.email}</span>
              </div>

              <div className="text-center bg-indigo-500/10 p-3 rounded-lg border border-indigo-500/25">
                <div className="text-2xl font-display font-extrabold text-indigo-300">{parsedCandidate.atsScore}%</div>
                <div className="text-[8px] text-indigo-400 font-mono block uppercase">ATS Match Ratio</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-[#08080f]/50 rounded-lg border border-white/5">
                <span className="text-[8px] font-mono text-gray-500 block uppercase">Semantic Match</span>
                <span className="text-base font-display font-bold text-white mt-1 block">{parsedCandidate.matchBreakdown?.semantic || 85}%</span>
              </div>
              <div className="p-3 bg-[#08080f]/50 rounded-lg border border-white/5">
                <span className="text-[8px] font-mono text-gray-500 block uppercase">Keyword Match</span>
                <span className="text-base font-display font-bold text-white mt-1 block">{parsedCandidate.matchBreakdown?.keywords || 80}%</span>
              </div>
              <div className="p-3 bg-[#08080f]/50 rounded-lg border border-white/5">
                <span className="text-[8px] font-mono text-gray-500 block uppercase">Fraud Risk</span>
                <span className="text-base font-display font-bold text-white mt-1 block">{parsedCandidate.fraudScore || 0}%</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Candidate Profile Vector Mapping</h4>
              <div className="flex flex-wrap gap-1">
                {parsedCandidate.skills.map((skill) => (
                  <span key={skill.name} className="text-[9px] bg-white/5 border border-white/10 text-gray-300 px-2 py-1 rounded font-mono">
                    {skill.name} ({skill.score}/100)
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-white/5 pt-4">
              <h4 className="text-[10px] text-gray-400 font-mono uppercase tracking-wider flex items-center">
                <GraduationCap className="w-4 h-4 text-cyan-400 mr-1.5 animate-pulse" /> Growth Suggestions
              </h4>
              <div className="space-y-2 bg-[#08080f] p-4 rounded border border-white/10">
                {(parsedCandidate.roadmap || []).map((step, index) => (
                  <div key={index} className="flex gap-3 text-[10px] leading-relaxed">
                    <span className="text-cyan-400 font-mono font-extrabold">{index + 1}.</span>
                    <p className="text-gray-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg text-[9px] text-indigo-300">
              Your application has been saved and is now available to authenticated recruiters for review.
            </div>
          </div>
        ) : (
          <div className="glassmorphism p-12 rounded-[28px] border border-white/10 text-center h-full flex flex-col items-center justify-center space-y-4 text-slate-400">
            <div className="p-4 bg-indigo-500/5 rounded-full text-indigo-400 ring-4 ring-indigo-500/10">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">No active parsing match loaded</p>
              <p className="text-[10px] text-gray-400 mt-1 max-w-sm mx-auto">
                Drop a PDF resume above or paste resume text to parse and submit your profile.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
