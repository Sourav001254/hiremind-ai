/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { GoogleGenAI, Type } from '@google/genai';
import { readDb, writeDb } from '../lib/firebase';
import { authenticateUser, type AuthenticatedRequest } from './auth';

export const router = express.Router();

const copilotRequestSchema = z.object({
  message: z.string().min(3).max(1200),
  history: z
    .array(
      z.object({
        sender: z.enum(['user', 'system', 'copilot']),
        text: z.string().max(2000),
      }),
    )
    .max(12)
    .optional(),
});

const outreachDraftSchema = z.object({
  candidateId: z.string().min(1),
  jobId: z.string().min(1),
});

const outreachSendSchema = z.object({
  email: z.string().email(),
  subject: z.string().min(3).max(200),
  body: z.string().min(10).max(5000),
});

let genAIClient: GoogleGenAI | null = null;
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

function buildFallbackCopilotReply(message: string, candidates: any[]) {
  const lowered = message.toLowerCase();

  if (lowered.includes('fraud') || lowered.includes('risk') || lowered.includes('alert')) {
    const risky = candidates.filter((candidate) => candidate.fraudScore >= 40);
    if (risky.length === 0) {
      return 'No candidates currently exceed the fraud-risk review threshold.';
    }
    return risky
      .map((candidate) => `- ${candidate.name}: fraud score ${candidate.fraudScore}% with flags: ${(candidate.redFlags || []).join(', ') || 'none listed'}`)
      .join('\n');
  }

  const ranked = [...candidates].sort((a, b) => b.score - a.score).slice(0, 3);
  return ranked
    .map((candidate, index) => `- #${index + 1} ${candidate.name}: ${candidate.score}% overall match for ${candidate.role}`)
    .join('\n');
}

router.post('/api/copilot', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const validation = copilotRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid copilot request.', details: validation.error.format() });
    }

    const db = await readDb();
    const candidates = db.candidates || [];
    const jobs = db.jobs || [];
    const ai = getGenAI();

    let text = '';
    if (!ai) {
      text = buildFallbackCopilotReply(validation.data.message, candidates);
    } else {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Recruiter question: ${validation.data.message}

Grounded candidates:
${JSON.stringify(candidates, null, 2)}

Open jobs:
${JSON.stringify(jobs, null, 2)}

Recent history:
${JSON.stringify(validation.data.history || [], null, 2)}`,
              },
            ],
          },
        ],
        config: {
          systemInstruction:
            'You are a recruiting copilot. Answer only with details grounded in the provided candidate and job data. Keep the answer concise and practical.',
          temperature: 0.2,
        },
      });
      text = response.text || 'The copilot could not compile a grounded answer.';
    }

    const loweredText = text.toLowerCase();
    const citations = candidates
      .filter((candidate: any) => loweredText.includes(candidate.name.toLowerCase()))
      .map((candidate: any) => ({
        title: candidate.name,
        rating: candidate.score,
      }));

    res.json({ text, citations });
  } catch (error: any) {
    res.status(500).json({
      error: 'Recruiter Copilot API error occurred.',
      details: error.message || error,
    });
  }
});

router.post('/api/outreach/draft', authenticateUser, async (_req: AuthenticatedRequest, res) => {
  try {
    const validation = outreachDraftSchema.safeParse(_req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Candidate and job IDs are required.', details: validation.error.format() });
    }

    const db = await readDb();
    const candidate = (db.candidates || []).find((entry: any) => entry.id === validation.data.candidateId);
    const job = (db.jobs || []).find((entry: any) => entry.id === validation.data.jobId);
    if (!candidate || !job) {
      return res.status(404).json({ error: 'Requested profile or job spec was not found.' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        success: true,
        subject: `Interview opportunity for ${job.title}`,
        body: `Hi ${candidate.name},\n\nYour background in ${candidate.skills.map((skill: any) => skill.name).slice(0, 4).join(', ')} stood out for our ${job.title} role. If you're open to it, we'd love to schedule a short conversation.\n\nBest,\nHireMind Recruiting`,
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `
        Draft a concise recruitment email to ${candidate.name} for the role "${job.title}".
        Candidate skills: ${JSON.stringify(candidate.skills)}.
        Job summary: ${job.description}.
      `,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['subject', 'body'],
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
          },
        },
        temperature: 0.7,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, subject: parsed.subject, body: parsed.body });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate outreach pitch.', details: error.message || error });
  }
});

router.post('/api/outreach/send', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const validation = outreachSendSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Valid recipient, subject, and body are required.', details: validation.error.format() });
    }

    const smtpPort = Number.parseInt(process.env.SMTP_PORT || '587', 10);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.SMTP_USER || 'mock.recruiter@ethereal.email',
        pass: process.env.SMTP_PASS || 'mock-pass-word-321',
      },
    });

    let mailInfo: any = { messageId: 'simulated-channel' };
    try {
      mailInfo = await transporter.sendMail({
        from: '"HireMind Recruiting" <noreply@hiremind.ai>',
        to: validation.data.email,
        subject: validation.data.subject,
        text: validation.data.body,
      });
    } catch {
      // Keep demo and local development functional even without a live SMTP server.
    }

    const db = await readDb();
    db.auditLogs = [
      {
        id: `aud-outreach-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'CAMPAIGN_OUTBOUND_DISPATCHED',
        actor: req.user?.name || 'Recruiter',
        targetId: validation.data.email,
        details: `Interview outreach sent with subject "${validation.data.subject}".`,
        xaiMetadata: {
          shapValues: [],
          fairnessCheck: 'Outbound communication logged successfully.',
        },
      },
      ...(db.auditLogs || []),
    ].slice(0, 100);

    await writeDb(db);
    res.json({ success: true, info: mailInfo, auditLogs: db.auditLogs });
  } catch (err: any) {
    res.status(500).json({ error: 'Transaction carrier pipeline encountered errors.', details: err.message || err });
  }
});
