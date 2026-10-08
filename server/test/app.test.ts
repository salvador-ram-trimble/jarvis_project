import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { setupTestApp } from './testDb.js';

const ctx = setupTestApp();

describe('GET /api/health', () => {
  it('reports OK when the database is connected', async () => {
    const res = await request(ctx.app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'connected' });
  });
});

describe('unknown API routes', () => {
  it('return 404 in the shared error format', async () => {
    const res = await request(ctx.app).get('/api/nope');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: 'Not found' } });
  });
});

describe('serving the client build', () => {
  const clientDistPath = fs.mkdtempSync(path.join(os.tmpdir(), 'jarvis-client-'));
  fs.writeFileSync(path.join(clientDistPath, 'index.html'), '<!doctype html><title>Jarvis CRM</title>');

  afterAll(() => {
    fs.rmSync(clientDistPath, { recursive: true, force: true });
  });

  it('sends index.html for client routes so a refresh works', async () => {
    const app = createApp({ connection: ctx.connection, clientDistPath });

    const res = await request(app).get('/customers');

    expect(res.status).toBe(200);
    expect(res.text).toContain('<title>Jarvis CRM</title>');
  });

  it('still answers unknown API routes with JSON', async () => {
    const app = createApp({ connection: ctx.connection, clientDistPath });

    const res = await request(app).get('/api/nope');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: 'Not found' } });
  });
});
