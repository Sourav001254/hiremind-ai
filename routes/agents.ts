/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { readDb, writeDb } from '../lib/firebase';
import { authenticateUser } from './auth';
import { AuthenticatedRequest } from '../src/types';

export const router = express.Router();

// GET agents list
router.get(
  '/api/agents',
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const db = await readDb();
      res.json(db.agents || []);
    } catch (err: any) {
      res
        .status(500)
        .json({ error: 'Failed to load agents', details: err.message });
    }
  }
);

// POST toggle agent
router.post(
  '/api/agents/toggle',
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const db = await readDb();
      const agentId = req.body.id;
      const agent = db.agents.find((a: any) => a.id === agentId);
      if (agent) {
        agent.enabled = !agent.enabled;
        await writeDb(db);
        res.json(agent);
      } else {
        res.status(404).json({ error: 'Agent not found' });
      }
    } catch (err: any) {
      res
        .status(500)
        .json({ error: 'Failed to toggle agent', details: err.message });
    }
  }
);

// GET system events
router.get(
  '/api/system-events',
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const db = await readDb();
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        events: db.events || [],
      });
    } catch (err: any) {
      res
        .status(500)
        .json({ status: 'error', error: 'Failed to load system-events' });
    }
  }
);

// GET audit logs
router.get(
  '/api/audit-logs',
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const db = await readDb();
      res.json(db.auditLogs || []);
    } catch (err: any) {
      res
        .status(500)
        .json({ error: 'Failed to load audit logs', details: err.message });
    }
  }
);

// GET bias report
router.get(
  '/api/bias-report',
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const db = await readDb();
      res.json(db.biasReport || {});
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load bias statistics' });
    }
  }
);
