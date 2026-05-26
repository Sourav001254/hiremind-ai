import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import {
  getJobs,
  parseResume,
  parseResumeFile,
  createCandidate,
  getCandidates,
  updateCandidate,
  deleteCandidate,
} from '../services/candidateService';
import { authenticateUser } from './auth';
import { AuthenticatedRequest } from '../src/types';

export const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const publicAiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many applicant parsing requests. Please try again shortly.' },
});

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

router.get('/api/jobs', async (_req, res) => {
  try {
    const jobs = await getJobs();
    res.json(jobs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load job specs.', details: err.message });
  }
});

router.post('/api/public/parse-resume', publicAiLimiter, async (req, res) => {
  try {
    const candidate = await parseResume(req.body.resumeText, req.body.jobTitle);
    res.json(candidate);
  } catch (error: any) {
    res.status(500).json({ error: 'Text parser failed to scan credentials.', details: error.message || error });
  }
});

router.post('/api/parse-resume', publicAiLimiter, async (req, res) => {
  try {
    const candidate = await parseResume(req.body.resumeText, req.body.jobTitle);
    res.json(candidate);
  } catch (error: any) {
    res.status(500).json({ error: 'Text parser failed to scan credentials.', details: error.message || error });
  }
});

router.post(
  '/api/public/candidates/upload',
  publicAiLimiter,
  upload.single('resume'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Resume file is missing.' });
      }
      const candidate = await parseResumeFile(req.file, req.body.jobTitle);
      res.json(candidate);
    } catch (error: any) {
      res.status(500).json({ error: 'File parser failed to scan credentials.', details: error.message || error });
    }
  }
);

router.post('/api/public/candidates', async (req, res) => {
  try {
    const newCandidate = await createCandidate(req.body);
    res.status(201).json({ success: true, candidate: newCandidate });
  } catch (error: any) {
    res.status(400).json({ error: 'Invalid candidate data.', details: error.message || error });
  }
});

router.get(
  '/api/candidates',
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const candidates = await getCandidates();
      res.json(candidates);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load candidates.', details: err.message });
    }
  }
);

router.post(
  '/api/candidates/update',
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const updatedCandidate = await updateCandidate(req.body);
      res.json({ success: true, candidate: updatedCandidate });
    } catch (error: any) {
      res.status(400).json({ error: 'Invalid candidate data for update.', details: error.message || error });
    }
  }
);

router.delete(
  '/api/candidates/:id',
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      await deleteCandidate(req.params.id);
      res.json({ success: true, message: 'Candidate deleted.' });
    } catch (error: any) {
      res.status(404).json({ error: 'Candidate not found for deletion.', details: error.message || error });
    }
  }
);

router.post(
  '/api/candidates/export-compliance',
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const candidateId = typeof req.body?.candidateId === 'string' ? req.body.candidateId : '';
      const complianceOfficer = typeof req.body?.complianceOfficer === 'string' ? req.body.complianceOfficer : 'Compliance Officer';
      if (!candidateId) {
        return res.status(400).json({ error: 'Candidate ID is required.' });
      }

      const db = await readDb();
      const candidate = (db.candidates || []).find((entry: any) => entry.id === candidateId);
      if (!candidate) {
        return res.status(404).json({ error: 'Profile not found.' });
      }

      const reportHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
        <title>HireMind Compliance Report</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 32px; }
          .container { max-width: 760px; margin: 0 auto; background: white; border: 1px solid #cbd5e1; border-radius: 16px; padding: 32px; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
          .label { color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
          .value { font-size: 18px; font-weight: 700; color: #0f172a; }
          .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
          .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="label">HireMind Compliance Report</div>
            <h1>${escapeHtml(candidate.name)}</h1>
            <p>Role under review: ${escapeHtml(candidate.role)}</p>
          </div>
          <div class="row">
            <div class="card">
              <div class="label">Candidate Email</div>
              <div class="value">${escapeHtml(candidate.email)}</div>
            </div>
            <div class="card">
              <div class="label">Overall Match Score</div>
              <div class="value">${escapeHtml(candidate.score)}%</div>
            </div>
          </div>
          <div class="row">
            <div class="card">
              <div class="label">Fraud Risk Score</div>
              <div class="value">${escapeHtml(candidate.fraudScore)}%</div>
            </div>
            <div class="card">
              <div class="label">Reviewed By</div>
              <div class="value">${escapeHtml(complianceOfficer)}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

      res.json({
        success: true,
        filename: `${candidate.name.replace(/\s+/g, '_')}_Compliance_Report.html`,
        html: reportHtml,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate report.', details: err.message });
    }
  }
);
