/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs/promises';
import path from 'path';

export const DB_PATH = path.join(process.cwd(), 'db.json');

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, pathValue: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: false,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path: pathValue,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let db: any = null;

export async function initFirebase() {
  // Force fallback to local db.json for local development
  console.log('Firebase Admin initialization skipped. Falling back to local db.json.');
  return null;
}

async function migrateDbJsonToFirestore() {
  if (!db) {
    return;
  }

  try {
    const candidateSnapshot = await db.collection('candidates').limit(1).get();
    if (!candidateSnapshot.empty) {
      return;
    }

    let localData: any = { candidates: [], jobs: [], agents: [], events: [], auditLogs: [], biasReport: {} };
    try {
      localData = JSON.parse(await fs.readFile(DB_PATH, 'utf-8'));
    } catch {
      return;
    }

    await writeDb(localData);
  } catch (err) {
    console.error('Seed migration encountered an error:', err);
  }
}

export async function readDb() {
  if (!db) {
    try {
      return JSON.parse(await fs.readFile(DB_PATH, 'utf-8'));
    } catch {
      return { candidates: [], jobs: [], agents: [], events: [], auditLogs: [], biasReport: {} };
    }
  }

  try {
    const [candidateSnapshot, jobSnapshot, agentSnapshot, eventSnapshot, auditSnapshot, reportSnapshot] = await Promise.all([
      db.collection('candidates').get(),
      db.collection('jobs').get(),
      db.collection('agents').get(),
      db.collection('events').get(),
      db.collection('auditLogs').get(),
      db.collection('biasReport').doc('overall').get(),
    ]);

    return {
      candidates: candidateSnapshot.docs.map((doc: any) => doc.data()),
      jobs: jobSnapshot.docs.map((doc: any) => doc.data()),
      agents: agentSnapshot.docs.map((doc: any) => doc.data()),
      events: eventSnapshot.docs.map((doc: any) => doc.data()),
      auditLogs: auditSnapshot.docs.map((doc: any) => doc.data()),
      biasReport: reportSnapshot.exists ? reportSnapshot.data() : {},
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'all_collections');
  }
}

async function syncCollection(collectionName: string, items: any[]) {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  const nextIds = new Set(
    items
      .map((item) => item?.id)
      .filter(Boolean),
  );

  const batch = db.batch();
  snapshot.docs.forEach((doc: any) => {
    if (!nextIds.has(doc.id)) {
      batch.delete(doc.ref);
    }
  });

  items.forEach((item) => {
    if (item?.id) {
      batch.set(collectionRef.doc(item.id), item);
    }
  });

  await batch.commit();
}

export async function writeDb(data: any) {
  if (!db) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return;
  }

  try {
    await Promise.all([
      syncCollection('candidates', data.candidates || []),
      syncCollection('jobs', data.jobs || []),
      syncCollection('agents', data.agents || []),
      syncCollection('events', data.events || []),
      syncCollection('auditLogs', data.auditLogs || []),
      db.collection('biasReport').doc('overall').set(data.biasReport || {}),
    ]);
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, 'write_db_synchronizer');
  }
}
