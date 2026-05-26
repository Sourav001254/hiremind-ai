/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

process.env.ALLOW_DEMO_AUTH = 'true';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const baseDb = {
  candidates: [
    {
      id: 'cand-1',
      name: 'Authorized Target',
      role: 'Senior React Architect',
      email: 'target@hiremind.ai',
      score: 90,
      skills: [{ name: 'React', score: 92 }],
      experience: [],
      education: [],
      atsScore: 90,
      matchBreakdown: { semantic: 91, keywords: 89, overall: 90 },
      shapValues: [],
      redFlags: [],
      fraudScore: 0,
      roadmap: [],
    },
  ],
  jobs: [
    {
      id: 'job-1',
      title: 'Senior React Architect',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-Time',
      skillsRequired: ['React'],
      description: 'Build modern frontend systems.',
    },
  ],
  agents: [],
  events: [],
  auditLogs: [],
  biasReport: {},
};

let mockedDb: any = structuredClone(baseDb);

vi.mock('../../lib/firebase', () => ({
  readDb: async () => mockedDb,
  writeDb: async (nextDb: any) => {
    mockedDb = structuredClone(nextDb);
  },
}));

import { router as candidatesRouter } from '../../routes/candidates';
import { router as authRouter, JWT_SECRET } from '../../routes/auth';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(authRouter);
app.use(candidatesRouter);

describe('HireMind API security and contract checks', () => {
  beforeEach(() => {
    mockedDb = structuredClone(baseDb);
  });

  function getAuthCookie() {
    const token = jwt.sign(
      {
        email: 'recruiter@hiremind.ai',
        name: 'Demo Recruiter',
        role: 'recruiter',
        authenticatedAt: new Date().toISOString(),
      },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    return [`hiremind_auth_token=${token}`];
  }

  it('blocks recruiter candidate listing without authentication', async () => {
    const response = await request(app).get('/api/candidates');
    expect(response.status).toBe(401);
  });

  it('allows public candidate submission without authentication', async () => {
    const response = await request(app).post('/api/public/candidates').send({
      name: 'Public Applicant',
      role: 'Senior React Architect',
      email: 'public@applicant.dev',
      skills: [{ name: 'React', score: 88 }],
      experience: [],
      education: [],
      shapValues: [],
      redFlags: [],
      roadmap: [],
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(mockedDb.candidates.some((candidate: any) => candidate.email === 'public@applicant.dev')).toBe(true);
  });

  it('recalculates recruiter updates instead of trusting raw score input', async () => {
    const authCookie = getAuthCookie();
    const response = await request(app)
      .post('/api/candidates/update')
      .set('Cookie', authCookie)
      .send({
        id: 'cand-1',
        name: 'Authorized Target',
        role: 'Senior React Architect',
        email: 'target@hiremind.ai',
        skills: [{ name: 'React', score: 99 }],
        experience: [],
        education: [],
        shapValues: [],
        redFlags: [],
        roadmap: [],
        score: 0,
      });

    expect(response.status).toBe(200);
    expect(response.body.candidate.score).toBeGreaterThan(0);
    expect(response.body.candidate.score).not.toBe(0);
  });

  it('deletes candidates from persistence instead of leaving stale records behind', async () => {
    const authCookie = getAuthCookie();
    const response = await request(app)
      .delete('/api/candidates/cand-1')
      .set('Cookie', authCookie);

    expect(response.status).toBe(200);
    expect(mockedDb.candidates.find((candidate: any) => candidate.id === 'cand-1')).toBeUndefined();
  });

  it('escapes user-controlled values in compliance export HTML', async () => {
    mockedDb.candidates[0].name = '<script>alert(1)</script>';
    const authCookie = getAuthCookie();
    const response = await request(app)
      .post('/api/candidates/export-compliance')
      .set('Cookie', authCookie)
      .send({ candidateId: 'cand-1', complianceOfficer: 'Admin' });

    expect(response.status).toBe(200);
    expect(response.body.html).not.toContain('<script>alert(1)</script>');
    expect(response.body.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});
