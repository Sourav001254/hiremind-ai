/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import type { Request, Response, NextFunction } from 'express';

export const router = express.Router();

const isProduction = process.env.NODE_ENV === 'production';
const allowDemoAuth = process.env.ALLOW_DEMO_AUTH === 'true' && !isProduction;
const configuredJwtSecret = process.env.JWT_SECRET;

export const JWT_SECRET =
  configuredJwtSecret ||
  (isProduction ? '' : 'development-only-secret-change-me');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000,
  };
}

function getUserRole(email: string): AuthenticatedUser['role'] {
  return /^admin@|^compliance@|^security@/i.test(email)
    ? 'admin'
    : 'recruiter';
}

function issueAuthCookie(res: Response, user: AuthenticatedUser) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured before issuing auth tokens.');
  }

  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
  res.cookie('hiremind_auth_token', token, getCookieOptions());
}

function parseCookieHeader(cookieHeader?: string) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) {
    return cookies;
  }

  cookieHeader.split(';').forEach(part => {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (!rawName) {
      return;
    }
    cookies[rawName] = decodeURIComponent(rawValue.join('='));
  });

  return cookies;
}

export function verifyAuthToken(token?: string): AuthenticatedUser | null {
  if (!token || !JWT_SECRET) {
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
  } catch {
    return null;
  }
}

export function verifyAuthTokenFromRequest(
  req: Request
): AuthenticatedUser | null {
  const cookieToken =
    (req as AuthenticatedRequest).cookies?.hiremind_auth_token ||
    parseCookieHeader(req.headers.cookie).hiremind_auth_token;

  return verifyAuthToken(cookieToken);
}

export function authenticateUser(
  req: AuthenticatedRequest | UnauthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const verified = verifyAuthTokenFromRequest(req);
  if (!verified) {
    return res
      .status(401)
      .json({ error: 'Unauthorized. Valid recruiter session required.' });
  }

  (req as AuthenticatedRequest).user = verified;
  next();
}

// Check SSO login URLs
router.get('/api/auth/url', (_req, res) => {
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    return res.json({ url: '/auth/google', mode: 'google' });
  }

  if (allowDemoAuth) {
    return res.json({ url: '/auth/login-sim', mode: 'demo' });
  }

  return res.status(503).json({
    error:
      'Authentication is not configured. Set Google OAuth credentials or enable ALLOW_DEMO_AUTH for local development.',
  });
});

// Current user info
router.get('/api/auth/me', (req, res) => {
  const verified = verifyAuthTokenFromRequest(req);
  res.json({ user: verified });
});

// Local demo-only logins
router.post('/api/auth/login-secure', (req, res) => {
  if (!allowDemoAuth) {
    return res.status(403).json({ error: 'Demo authentication is disabled.' });
  }

  const { email, name } = req.body || {};
  if (!email || !name) {
    return res.status(400).json({ error: 'Missing identity parameters.' });
  }

  const userPayload: AuthenticatedUser = {
    email,
    name,
    picture: '',
    role: getUserRole(email),
    authenticatedAt: new Date().toISOString(),
  };

  issueAuthCookie(res, userPayload);
  res.json({ success: true, user: userPayload });
});

router.post('/api/auth/signout', (_req, res) => {
  res.clearCookie('hiremind_auth_token', getCookieOptions());
  res.json({ success: true });
});

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${
          process.env.APP_URL || 'http://localhost:3000'
        }/auth/google/callback`,
      },
      (_accessToken, _refreshToken, profile, done) => {
        const email = profile.emails?.[0]?.value || '';
        const user: AuthenticatedUser = {
          email,
          name: profile.displayName,
          picture: profile.photos?.[0]?.value || '',
          role: getUserRole(email),
          authenticatedAt: new Date().toISOString(),
        };
        return done(null, user);
      }
    )
  );

  router.use(passport.initialize());

  router.get(
    '/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  router.get(
    '/auth/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: '/?auth_error=oauth_failed',
    }),
    (req: AuthenticatedRequest, res) => {
      if (!req.user) {
        return res.redirect('/?auth_error=auth_failed');
      }

      issueAuthCookie(res, req.user);
      res.redirect('/');
    }
  );
}

if (allowDemoAuth) {
  router.get('/auth/login-sim', (_req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>HireMind Demo Authentication</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; background: #070913; color: #f3f4f6; }
          </style>
        </head>
        <body class="flex items-center justify-center min-h-screen px-4">
          <div class="w-full max-w-sm bg-[#0e1324]/90 border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div class="space-y-2 text-center">
              <h1 class="text-lg font-semibold text-white">Local Demo Login</h1>
              <p class="text-xs text-gray-400">Enabled only for non-production development when ALLOW_DEMO_AUTH=true.</p>
            </div>
            <div class="mt-6 space-y-3">
              <button onclick="selectAccount('recruiter@hiremind.ai', 'Demo Recruiter')" class="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10 transition">
                <div class="text-sm font-medium text-white">Demo Recruiter</div>
                <div class="text-xs text-gray-500">recruiter@hiremind.ai</div>
              </button>
              <button onclick="selectAccount('admin@hiremind.ai', 'Enterprise Admin')" class="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10 transition">
                <div class="text-sm font-medium text-white">Enterprise Admin</div>
                <div class="text-xs text-gray-500">admin@hiremind.ai</div>
              </button>
            </div>
            <script>
              async function selectAccount(email, name) {
                const res = await fetch('/api/auth/login-secure', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, name })
                });
                const payload = await res.json();
                if (!res.ok) {
                  alert(payload.error || 'Login failed');
                  return;
                }
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: payload.user }, window.location.origin);
                  window.close();
                } else {
                  window.location.href = '/?sso_success=true';
                }
              }
            </script>
          </div>
        </body>
      </html>
    `);
  });
}
