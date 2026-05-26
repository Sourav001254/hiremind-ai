/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import { GoogleGenAI, Type } from '@google/genai';
import { readDb, writeDb } from '../lib/firebase';

type Skill = { name: string; score: number };
type Experience = { role: string; company: string; duration: string; description: string };
type Education = { degree: string; school: string; year: string };

const skillSchema = z.object({
  name: z.string().min(1).max(80),
  score: z.number().int().min(0).max(100),
});

const candidateBaseSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().min(1).max(150),
  email: z.string().email(),
  skills: z.array(skillSchema).max(50).default([]),
  experience: z
    .array(
      z.object({
        role: z.string().min(1).max(150),
        company: z.string().min(1).max(150),
        duration: z.string().min(1).max(80),
        description: z.string().min(1).max(400),
      }),
    )
    .max(20)
    .default([]),
  education: z
    .array(
      z.object({
        degree: z.string().min(1).max(150),
        school: z.string().min(1).max(150),
        year: z.string().min(1).max(20),
      }),
    )
    .max(10)
    .default([]),
  atsScore: z.number().int().min(0).max(100).optional(),
  matchBreakdown: z
    .object({
      semantic: z.number().int().min(0).max(100),
      keywords: z.number().int().min(0).max(100),
      overall: z.number().int().min(0).max(100),
    })
    .optional(),
  shapValues: z
    .array(
      z.object({
        feature: z.string().min(1).max(120),
        value: z.number().int().min(-100).max(100),
      }),
    )
    .max(20)
    .default([]),
  redFlags: z.array(z.string().min(1).max(200)).max(20).default([]),
  fraudScore: z.number().int().min(0).max(100).optional(),
  roadmap: z.array(z.string().min(1).max(200)).max(20).default([]),
});

export const publicCandidateSchema = candidateBaseSchema.extend({
  id: z.string().min(1).max(80).optional(),
  score: z.number().int().min(0).max(100).optional(),
});

export const candidateUpdateSchema = candidateBaseSchema.extend({
  id: z.string().min(1).max(80),
});

export const resumeTextSchema = z.object({
  resumeText: z.string().min(20).max(30000),
  jobTitle: z.string().min(1).max(150).optional(),
});

function normalizeSkills(skills: Skill[]) {
  return skills
    .filter((skill) => skill.name.trim())
    .map((skill) => ({
      name: skill.name.trim(),
      score: Math.max(0, Math.min(100, Math.round(skill.score))),
    }));
}

function calculateAtsScore(skills: Skill[]) {
  if (skills.length === 0) {
    return 65;
  }

  const avg = skills.reduce((sum, skill) => sum + skill.score, 0) / skills.length;
  return Math.max(40, Math.min(100, Math.round(avg)));
}

function calculateFraudScore(redFlags: string[]) {
  return Math.min(100, redFlags.length * 20);
}

function buildCandidateRecord(input: z.infer<typeof publicCandidateSchema>, existing?: any) {
  const skills = normalizeSkills(input.skills ?? existing?.skills ?? []);
  const atsScore = input.atsScore ?? existing?.atsScore ?? calculateAtsScore(skills);
  const semantic = input.matchBreakdown?.semantic ?? Math.max(40, Math.min(100, atsScore + 2));
  const keywords = input.matchBreakdown?.keywords ?? atsScore;
  const overall = Math.round((semantic + keywords + atsScore) / 3);
  const redFlags = input.redFlags ?? existing?.redFlags ?? [];
  const fraudScore = input.fraudScore ?? existing?.fraudScore ?? calculateFraudScore(redFlags);

  return {
    id: input.id || existing?.id || `cand-${Date.now()}`,
    name: input.name.trim(),
    role: input.role.trim(),
    email: input.email.trim().toLowerCase(),
    score: Math.max(0, Math.min(100, Math.round((overall + atsScore) / 2))),
    skills,
    experience: input.experience ?? existing?.experience ?? [],
    education: input.education ?? existing?.education ?? [],
    atsScore,
    matchBreakdown: {
      semantic,
      keywords,
      overall,
    },
    shapValues: input.shapValues ?? existing?.shapValues ?? [],
    redFlags,
    fraudScore,
    roadmap: input.roadmap ?? existing?.roadmap ?? [],
    fraudDetails:
      fraudScore >= 40
        ? {
            suspiciousTimeline: redFlags.some((flag) => /timeline|gap/i.test(flag)),
            duplicateSuspect: redFlags.some((flag) => /duplicate/i.test(flag)),
            plagiarismDetected: redFlags.some((flag) => /plagiarism/i.test(flag)),
            reason: redFlags.join('; ') || 'Elevated risk indicators detected.',
          }
        : existing?.fraudDetails,
    submittedAt: existing?.submittedAt || new Date().toISOString(),
    submissionSource: existing?.submissionSource || 'public-portal',
  };
}

function simpleResumeParse(resumeText: string, jobTitle?: string) {
  const lines = resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const emailMatch = resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const name = lines[0] || 'Unknown Candidate';
  const role = jobTitle || lines[2] || lines[1] || 'Applicant';
  const email = emailMatch?.[0]?.toLowerCase() || `candidate-${Date.now()}@example.com`;

  const skillSection = resumeText.match(/skills?:([\s\S]{0,200})/i)?.[1] || '';
  const rawSkills = skillSection
    .split(/,|\||•|·/)
    .map((skill) => skill.replace(/\.$/, '').trim())
    .filter(Boolean)
    .slice(0, 12);

  const skills = rawSkills.map((skill, index) => ({
    name: skill,
    score: Math.max(60, 92 - index * 3),
  }));

  const experience: Experience[] = [];
  lines.forEach((line) => {
    if (/ at /i.test(line) && /\(\d{4}/.test(line)) {
      const [rolePart, rest] = line.split(/ at /i);
      const durationMatch = rest.match(/\(([^)]+)\)/);
      experience.push({
        role: rolePart.replace(/^-+/, '').trim(),
        company: rest.replace(/\([^)]+\)/, '').trim(),
        duration: durationMatch?.[1] || 'Not specified',
        description: 'Imported from applicant resume text.',
      });
    }
  });

  const education: Education[] = [];
  const educationLine = lines.find((line) => /b\.|m\.|ph\.d|bachelor|master|education/i.test(line));
  if (educationLine) {
    education.push({
      degree: educationLine,
      school: 'Provided in resume',
      year: educationLine.match(/\b(19|20)\d{2}\b/)?.[0] || 'N/A',
    });
  }

  return buildCandidateRecord({
    name,
    role,
    email,
    skills,
    experience,
    education,
    shapValues: skills.slice(0, 4).map((skill) => ({
      feature: `${skill.name} proficiency`,
      value: Math.round((skill.score - 50) / 5),
    })),
    redFlags: [],
    roadmap: skills.slice(0, 3).map((skill) => `Strengthen ${skill.name} with role-specific project evidence.`),
  });
}

let genAIClient: GoogleGenAI | null = null;
let pdfParseModule: any = null;

async function getPdfParse() {
  if (!pdfParseModule) {
    const imported = (await import('pdf-parse')) as any;
    pdfParseModule = imported.default || imported;
  }

  return pdfParseModule;
}

function getGenAI() {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return genAIClient;
}

async function parseCandidateWithAi(resumeText: string, jobTitle?: string) {
  const ai = getGenAI();
  if (!ai) {
    return simpleResumeParse(resumeText, jobTitle);
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `
      Analyze the following resume details:
      "${resumeText}"

      The candidate is applying for: "${jobTitle || 'General Software Engineer'}".
      Extract a structured candidate profile with grounded skills, experience, education, explainability signals, and realistic caution flags.
    `,
    config: {
      systemInstruction:
        'You are the Resume Intelligence Agent. Return only grounded candidate facts in the provided schema.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        required: ['name', 'role', 'email', 'skills', 'experience', 'education', 'shapValues', 'redFlags', 'roadmap'],
        properties: {
          name: { type: Type.STRING },
          role: { type: Type.STRING },
          email: { type: Type.STRING },
          skills: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ['name', 'score'],
              properties: {
                name: { type: Type.STRING },
                score: { type: Type.INTEGER },
              },
            },
          },
          experience: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ['role', 'company', 'duration', 'description'],
              properties: {
                role: { type: Type.STRING },
                company: { type: Type.STRING },
                duration: { type: Type.STRING },
                description: { type: Type.STRING },
              },
            },
          },
          education: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ['degree', 'school', 'year'],
              properties: {
                degree: { type: Type.STRING },
                school: { type: Type.STRING },
                year: { type: Type.STRING },
              },
            },
          },
          shapValues: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ['feature', 'value'],
              properties: {
                feature: { type: Type.STRING },
                value: { type: Type.INTEGER },
              },
            },
          },
          redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
          roadmap: { type: Type.ARRAY, items: { type: Type.STRING } },
          atsScore: { type: Type.INTEGER },
          matchBreakdown: {
            type: Type.OBJECT,
            properties: {
              semantic: { type: Type.INTEGER },
              keywords: { type: Type.INTEGER },
              overall: { type: Type.INTEGER },
            },
          },
          fraudScore: { type: Type.INTEGER },
        },
      },
    },
  });

  const parsedJson = JSON.parse(response.text || '{}');
  const validation = publicCandidateSchema.safeParse(parsedJson);
  if (!validation.success) {
    return simpleResumeParse(resumeText, jobTitle);
  }

  return buildCandidateRecord(validation.data);
}

export async function getJobs() {
    const db = await readDb();
    return db.jobs || [];
}

export async function parseResume(resumeText: string, jobTitle?: string) {
    const validation = resumeTextSchema.safeParse({ resumeText, jobTitle });
    if (!validation.success) {
        throw new Error('Resume text is missing or invalid.');
    }
    return await parseCandidateWithAi(validation.data.resumeText, validation.data.jobTitle);
}

export async function parseResumeFile(file: Express.Multer.File, jobTitle?: string) {
    const pdfParse = await getPdfParse();
    const data = await pdfParse(file.buffer);
    return await parseCandidateWithAi(data.text, jobTitle);
}

export async function createCandidate(candidateData: any) {
    const validation = publicCandidateSchema.safeParse(candidateData);
    if (!validation.success) {
        throw new Error('Invalid candidate data.');
    }
    const db = await readDb();
    const newCandidate = buildCandidateRecord(validation.data);
    db.candidates.push(newCandidate);
    await writeDb(db);
    return newCandidate;
}

export async function getCandidates() {
    const db = await readDb();
    return db.candidates || [];
}

export async function updateCandidate(candidateData: any) {
    const validation = candidateUpdateSchema.safeParse(candidateData);
    if (!validation.success) {
        throw new Error('Invalid candidate data for update.');
    }
    const db = await readDb();
    const candidateIndex = db.candidates.findIndex((c: any) => c.id === validation.data.id);
    if (candidateIndex === -1) {
        throw new Error('Candidate not found.');
    }
    const updatedCandidate = buildCandidateRecord(validation.data, db.candidates[candidateIndex]);
    db.candidates[candidateIndex] = updatedCandidate;
    await writeDb(db);
    return updatedCandidate;
}

export async function deleteCandidate(candidateId: string) {
    const db = await readDb();
    const initialCount = db.candidates.length;
    db.candidates = db.candidates.filter((c: any) => c.id !== candidateId);
    if (db.candidates.length === initialCount) {
        throw new Error('Candidate not found for deletion.');
    }
    await writeDb(db);
}
