/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import http from 'http';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { initFirebase } from './lib/firebase';
import { router as authRouter, verifyAuthTokenFromRequest } from './routes/auth';
import { router as candidatesRouter } from './routes/candidates';
import { router as agentsRouter } from './routes/agents';
import { router as copilotRouter } from './routes/copilot';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.set('trust proxy', 1);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests from this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use((_, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ws:;"
  );
  next();
});

app.use(generalLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use(authRouter);
app.use(candidatesRouter);
app.use(agentsRouter);
app.use(copilotRouter);

interface RecruiterPresence {
  id: string;
  userEmail: string;
  name: string;
  color: string;
  activeCandidateId: string | null;
}

const activeRecruiters = new Map<WebSocket, RecruiterPresence>();

async function startServer() {
  await initFirebase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    if (request.url !== '/ws') {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }

    const user = verifyAuthTokenFromRequest(request as any);
    if (!user) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      (ws as WebSocket & { user?: typeof user }).user = user;
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws: WebSocket & { user?: any }) => {
    const user = ws.user;
    if (!user) {
      ws.close();
      return;
    }

    const defaultColors = ['#ec4899', '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
    const assignedColor = defaultColors[Math.floor(Math.random() * defaultColors.length)];

    const presence: RecruiterPresence = {
      id: `recruiter-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userEmail: user.email,
      name: user.name,
      color: assignedColor,
      activeCandidateId: null,
    };

    activeRecruiters.set(ws, presence);

    ws.send(
      JSON.stringify({
        type: 'PRESENCE_INIT',
        self: presence,
        recruiters: Array.from(activeRecruiters.values()),
      }),
    );

    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: 'PRESENCE_JOIN',
            recruiter: presence,
          }),
        );
      }
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        const current = activeRecruiters.get(ws);
        if (!current) {
          return;
        }

        if (data.type === 'UPDATE_PRESENCE') {
          if (typeof data.activeCandidateId === 'string' || data.activeCandidateId === null) {
            current.activeCandidateId = data.activeCandidateId;
          }

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: 'PRESENCE_UPDATE',
                  recruiter: current,
                }),
              );
            }
          });
        } else if (data.type === 'CHAT_MESSAGE' && typeof data.text === 'string' && data.text.trim()) {
          const chatMsg = {
            id: `chat-${Date.now()}`,
            sender: current.name,
            senderColor: current.color,
            text: data.text.trim().slice(0, 500),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: 'CHAT_MESSAGE',
                  message: chatMsg,
                }),
              );
            }
          });
        }
      } catch (error) {
        console.error('Error managing websocket event:', error);
      }
    });

    ws.on('close', () => {
      const disappearingRecruiter = activeRecruiters.get(ws);
      activeRecruiters.delete(ws);
      if (disappearingRecruiter) {
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: 'PRESENCE_LEAVE',
                recruiterId: disappearingRecruiter.id,
              }),
            );
          }
        });
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`HireMind server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
