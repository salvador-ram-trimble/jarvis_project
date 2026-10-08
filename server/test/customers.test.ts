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

const fullInput = {
  name: 'Ada Lovelace',
  company: 'Analytical Engines Ltd',
  email: 'ada@example.com',
  phone: '+1 555 0100',
  address: { street: '1 Main St', city: 'Springfield', state: 'IL', postalCode: '62701', country: 'USA' },
  notes: 'Prefers email.',
};

async function createCustomer(input: object = fullInput): Promise<Customer> {
  const res = await request(ctx.app).post('/api/customers').send(input).expect(201);
  return res.body as Customer;
}

describe('POST /api/customers with every field', () => {
  it('stores and returns every field', async () => {
    const customer = await createCustomer();

    expect(customer).toEqual({
      ...fullInput,
      id: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('leaves out blank optional fields and an empty address', async () => {
    const customer = await createCustomer({
      name: 'Bob',
      company: '  ',
      email: '',
      address: { street: '', city: ' ' },
    });

    expect(Object.keys(customer).sort()).toEqual(['createdAt', 'id', 'name', 'updatedAt']);
  });

  it('returns 400 with an email field error for an invalid email', async () => {
    const res = await request(ctx.app).post('/api/customers').send({ name: 'Bob', email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body as ApiErrorBody).toEqual({
      error: { message: 'Validation failed', fields: { email: 'Enter a valid email address' } },
    });
  });

  it('ignores fields clients may not set', async () => {
    const customer = await createCustomer({ name: 'Bob', id: 'abc', createdAt: '2000-01-01T00:00:00.000Z' });

    expect(customer.id).not.toBe('abc');
    expect(customer.createdAt).not.toBe('2000-01-01T00:00:00.000Z');
  });
});

describe('GET /api/customers/:id', () => {
  it('returns the customer', async () => {
    const created = await createCustomer();

    const res = await request(ctx.app).get(`/api/customers/${created.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(created);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(ctx.app).get('/api/customers/0123456789abcdef01234567');

    expect(res.status).toBe(404);
    expect(res.body as ApiErrorBody).toEqual({ error: { message: 'Customer not found' } });
  });

  it('returns 404 for a malformed id', async () => {
    const res = await request(ctx.app).get('/api/customers/not-an-id');

    expect(res.status).toBe(404);
    expect(res.body as ApiErrorBody).toEqual({ error: { message: 'Not found' } });
  });
});

describe('PATCH /api/customers/:id', () => {
  it('changes only the fields sent and updates updatedAt', async () => {
    const created = await createCustomer();

    const res = await request(ctx.app)
      .patch(`/api/customers/${created.id}`)
      .send({ phone: '+1 555 0199', address: { city: 'Shelbyville' } });

    expect(res.status).toBe(200);
    const updated = res.body as Customer;
    expect(updated).toEqual({
      ...created,
      phone: '+1 555 0199',
      address: { city: 'Shelbyville' },
      updatedAt: expect.any(String),
    });
    expect(Date.parse(updated.updatedAt)).toBeGreaterThanOrEqual(Date.parse(created.updatedAt));

    const reloaded = await request(ctx.app).get(`/api/customers/${created.id}`);
    expect(reloaded.body).toEqual(updated);
  });

  it('clears fields sent as blank strings, and the address when it is empty', async () => {
    const created = await createCustomer();

    const res = await request(ctx.app)
      .patch(`/api/customers/${created.id}`)
      .send({ company: '', email: '', phone: '', notes: '', address: { street: '' } });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body as Customer).sort()).toEqual(['createdAt', 'id', 'name', 'updatedAt']);
  });

  it('returns 400 for an invalid email and keeps the stored customer unchanged', async () => {
    const created = await createCustomer();

    const res = await request(ctx.app).patch(`/api/customers/${created.id}`).send({ email: 'ada@' });

    expect(res.status).toBe(400);
    expect((res.body as ApiErrorBody).error.fields).toEqual({ email: 'Enter a valid email address' });
    const reloaded = await request(ctx.app).get(`/api/customers/${created.id}`);
    expect((reloaded.body as Customer).email).toBe('ada@example.com');
  });

  it('returns 400 when the name is cleared', async () => {
    const created = await createCustomer();

    const res = await request(ctx.app).patch(`/api/customers/${created.id}`).send({ name: '  ' });

    expect(res.status).toBe(400);
    expect((res.body as ApiErrorBody).error.fields).toEqual({ name: 'Name is required' });
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(ctx.app).patch('/api/customers/0123456789abcdef01234567').send({ name: 'X' });

    expect(res.status).toBe(404);
    expect(res.body as ApiErrorBody).toEqual({ error: { message: 'Customer not found' } });
  });

  it('returns 404 for a malformed id', async () => {
    const res = await request(ctx.app).patch('/api/customers/not-an-id').send({ name: 'X' });

    expect(res.status).toBe(404);
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
