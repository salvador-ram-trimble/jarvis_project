import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { ApiErrorBody, Customer } from '@jarvis/shared';
import { setupTestApp } from './testDb.js';

const ctx = setupTestApp();

describe('POST /api/customers', () => {
  it('creates a customer with just a name', async () => {
    const res = await request(ctx.app).post('/api/customers').send({ name: '  Acme Plumbing  ' });

    expect(res.status).toBe(201);
    const customer = res.body as Customer;
    expect(customer).toEqual({
      id: expect.any(String),
      name: 'Acme Plumbing',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(Number.isNaN(Date.parse(customer.createdAt))).toBe(false);
  });

  it('returns 400 with a name field error when the name is missing', async () => {
    const res = await request(ctx.app).post('/api/customers').send({});

    expect(res.status).toBe(400);
    expect(res.body as ApiErrorBody).toEqual({
      error: { message: 'Validation failed', fields: { name: 'Name is required' } },
    });
  });

  it('returns 400 when the name is only whitespace', async () => {
    const res = await request(ctx.app).post('/api/customers').send({ name: '   ' });

    expect(res.status).toBe(400);
    expect((res.body as ApiErrorBody).error.fields).toEqual({ name: 'Name is required' });
  });

  it('returns 400 in the shared error format for a malformed JSON body', async () => {
    const res = await request(ctx.app)
      .post('/api/customers')
      .set('Content-Type', 'application/json')
      .send('{"name":');

    expect(res.status).toBe(400);
    expect(res.body as ApiErrorBody).toEqual({ error: { message: 'Request body is not valid JSON' } });
  });
});

describe('GET /api/customers', () => {
  it('returns an empty list when there are no customers', async () => {
    const res = await request(ctx.app).get('/api/customers');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('lists created customers, newest first', async () => {
    await request(ctx.app).post('/api/customers').send({ name: 'First' }).expect(201);
    await request(ctx.app).post('/api/customers').send({ name: 'Second' }).expect(201);

    const res = await request(ctx.app).get('/api/customers');

    expect(res.status).toBe(200);
    expect((res.body as Customer[]).map((c) => c.name)).toEqual(['Second', 'First']);
  });
});
