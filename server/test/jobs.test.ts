import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { ApiErrorBody, Customer, Job } from '@jarvis/shared';
import { setupTestApp } from './testDb.js';

const ctx = setupTestApp();

const UNKNOWN_ID = '0123456789abcdef01234567';

async function createCustomer(name = 'Ada Lovelace', extra: object = {}): Promise<Customer> {
  const res = await request(ctx.app)
    .post('/api/customers')
    .send({ name, ...extra })
    .expect(201);
  return res.body as Customer;
}

async function createJob(input: object): Promise<Job> {
  const res = await request(ctx.app).post('/api/jobs').send(input).expect(201);
  return res.body as Job;
}

function fieldErrors(res: request.Response) {
  expect(res.status).toBe(400);
  const body = res.body as ApiErrorBody;
  expect(body.error.message).toBe('Validation failed');
  return body.error.fields;
}

const siteAddress = { street: '9 Site Rd', city: 'Shelbyville', state: 'IL', postalCode: '62565', country: 'USA' };

describe('POST /api/jobs', () => {
  it('creates a job with just a title and a customer, scheduled by default, with the customer summary', async () => {
    const customer = await createCustomer();

    const res = await request(ctx.app).post('/api/jobs').send({ title: '  Fix the sink ', customerId: customer.id });

    expect(res.status).toBe(201);
    expect(res.body as Job).toEqual({
      id: expect.any(String),
      title: 'Fix the sink',
      customer: { id: customer.id, name: 'Ada Lovelace' },
      status: 'scheduled',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('stores and returns every field', async () => {
    const customer = await createCustomer();
    const input = {
      title: 'Kitchen remodel',
      customerId: customer.id,
      status: 'in_progress',
      description: 'New cabinets and countertop.',
      scheduledStart: '2026-10-12',
      scheduledEnd: '2026-10-16',
      siteAddress,
      price: 1250,
    };

    const job = await createJob(input);

    const { customerId: _customerId, ...rest } = input;
    expect(job).toEqual({
      ...rest,
      id: expect.any(String),
      customer: { id: customer.id, name: 'Ada Lovelace' },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('accepts a start and end on the same day, and a price of zero', async () => {
    const customer = await createCustomer();

    const job = await createJob({
      title: 'Quote visit',
      customerId: customer.id,
      scheduledStart: '2026-10-12',
      scheduledEnd: '2026-10-12',
      price: 0,
    });

    expect(job).toMatchObject({ scheduledStart: '2026-10-12', scheduledEnd: '2026-10-12', price: 0 });
  });

  it('leaves out blank optional fields and an empty site address', async () => {
    const customer = await createCustomer();

    const job = await createJob({
      title: 'Fix the sink',
      customerId: customer.id,
      description: ' ',
      scheduledStart: '',
      scheduledEnd: '',
      siteAddress: { street: '', city: ' ' },
      price: null,
    });

    expect(Object.keys(job).sort()).toEqual(['createdAt', 'customer', 'id', 'status', 'title', 'updatedAt']);
  });

  it('returns 400 for a missing title and a missing customer', async () => {
    const res = await request(ctx.app).post('/api/jobs').send({ title: ' ' });

    expect(fieldErrors(res)).toEqual({ title: 'Title is required', customerId: 'Choose a customer' });
  });

  it('returns 400 for an unknown customer id', async () => {
    const res = await request(ctx.app).post('/api/jobs').send({ title: 'Fix the sink', customerId: UNKNOWN_ID });

    expect(fieldErrors(res)).toEqual({ customerId: 'This customer does not exist' });
  });

  it('returns 400 for a malformed customer id', async () => {
    const res = await request(ctx.app).post('/api/jobs').send({ title: 'Fix the sink', customerId: 'nope' });

    expect(fieldErrors(res)).toEqual({ customerId: 'This customer does not exist' });
  });

  it('returns 400 for an invalid status', async () => {
    const customer = await createCustomer();

    const res = await request(ctx.app)
      .post('/api/jobs')
      .send({ title: 'Fix the sink', customerId: customer.id, status: 'paused' });

    expect(fieldErrors(res)).toEqual({ status: 'Choose a valid status' });
  });

  it('returns 400 when the end date is before the start date', async () => {
    const customer = await createCustomer();

    const res = await request(ctx.app).post('/api/jobs').send({
      title: 'Fix the sink',
      customerId: customer.id,
      scheduledStart: '2026-10-12',
      scheduledEnd: '2026-10-11',
    });

    expect(fieldErrors(res)).toEqual({ scheduledEnd: "The end date can't be before the start date" });
  });

  it('returns 400 for a negative price', async () => {
    const customer = await createCustomer();

    const res = await request(ctx.app).post('/api/jobs').send({ title: 'Fix the sink', customerId: customer.id, price: -1 });

    expect(fieldErrors(res)).toEqual({ price: "The price can't be negative" });
  });

  it('returns 400 for values that are not a date or a price', async () => {
    const customer = await createCustomer();

    const res = await request(ctx.app).post('/api/jobs').send({
      title: 'Fix the sink',
      customerId: customer.id,
      scheduledStart: '2026-02-30',
      scheduledEnd: 'tomorrow',
      price: '12',
    });

    expect(fieldErrors(res)).toEqual({
      scheduledStart: 'Enter a valid date',
      scheduledEnd: 'Enter a valid date',
      price: 'Enter a valid price',
    });
  });

  it('reports every problem at once', async () => {
    const res = await request(ctx.app).post('/api/jobs').send({ customerId: UNKNOWN_ID, status: 'paused', price: -5 });

    expect(fieldErrors(res)).toEqual({
      title: 'Title is required',
      customerId: 'This customer does not exist',
      status: 'Choose a valid status',
      price: "The price can't be negative",
    });
  });

  it('ignores fields clients may not set', async () => {
    const customer = await createCustomer();

    const job = await createJob({ title: 'Fix the sink', customerId: customer.id, id: 'abc', customer: 'x' });

    expect(job.id).not.toBe('abc');
    expect(job.customer.id).toBe(customer.id);
  });
});

describe('GET /api/jobs/:id', () => {
  it('returns the job with its customer summary', async () => {
    const customer = await createCustomer();
    const created = await createJob({ title: 'Fix the sink', customerId: customer.id, price: 99.5 });

    const res = await request(ctx.app).get(`/api/jobs/${created.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(created);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(ctx.app).get(`/api/jobs/${UNKNOWN_ID}`);

    expect(res.status).toBe(404);
    expect(res.body as ApiErrorBody).toEqual({ error: { message: 'Job not found' } });
  });

  it('returns 404 for a malformed id', async () => {
    const res = await request(ctx.app).get('/api/jobs/not-an-id');

    expect(res.status).toBe(404);
    expect(res.body as ApiErrorBody).toEqual({ error: { message: 'Not found' } });
  });
});

describe('PATCH /api/jobs/:id', () => {
  async function setup() {
    const customer = await createCustomer();
    const job = await createJob({
      title: 'Kitchen remodel',
      customerId: customer.id,
      description: 'New cabinets.',
      scheduledStart: '2026-10-12',
      scheduledEnd: '2026-10-16',
      siteAddress,
      price: 1250,
    });
    return { customer, job };
  }

  it('changes only the fields sent', async () => {
    const { job } = await setup();

    const res = await request(ctx.app).patch(`/api/jobs/${job.id}`).send({ title: 'Kitchen refit', price: 1300.25 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...job, title: 'Kitchen refit', price: 1300.25, updatedAt: expect.any(String) });
    const reloaded = await request(ctx.app).get(`/api/jobs/${job.id}`);
    expect(reloaded.body).toEqual(res.body);
  });

  it('changes the status to any other status, cancelled included', async () => {
    const { job } = await setup();

    for (const status of ['done', 'scheduled', 'in_progress', 'cancelled']) {
      const res = await request(ctx.app).patch(`/api/jobs/${job.id}`).send({ status });
      expect(res.status).toBe(200);
      expect((res.body as Job).status).toBe(status);
    }
  });

  it('moves the job to a different customer', async () => {
    const { job } = await setup();
    const other = await createCustomer('Grace Hopper');

    const res = await request(ctx.app).patch(`/api/jobs/${job.id}`).send({ customerId: other.id });

    expect(res.status).toBe(200);
    expect((res.body as Job).customer).toEqual({ id: other.id, name: 'Grace Hopper' });
  });

  it('clears fields sent as blank, and the site address when it is empty', async () => {
    const { job } = await setup();

    const res = await request(ctx.app).patch(`/api/jobs/${job.id}`).send({
      description: '',
      scheduledStart: '',
      scheduledEnd: '',
      siteAddress: { street: '' },
      price: null,
    });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body as Job).sort()).toEqual(['createdAt', 'customer', 'id', 'status', 'title', 'updatedAt']);
  });

  it('returns 400 for an unknown customer and keeps the stored job unchanged', async () => {
    const { customer, job } = await setup();

    const res = await request(ctx.app).patch(`/api/jobs/${job.id}`).send({ customerId: UNKNOWN_ID, title: 'Changed' });

    expect(fieldErrors(res)).toEqual({ customerId: 'This customer does not exist' });
    const reloaded = await request(ctx.app).get(`/api/jobs/${job.id}`);
    expect((reloaded.body as Job).customer.id).toBe(customer.id);
    expect((reloaded.body as Job).title).toBe('Kitchen remodel');
  });

  it('returns 400 when the customer or title is cleared', async () => {
    const { job } = await setup();

    const res = await request(ctx.app).patch(`/api/jobs/${job.id}`).send({ customerId: '', title: '' });

    expect(fieldErrors(res)).toEqual({ title: 'Title is required', customerId: 'Choose a customer' });
  });

  it('returns 400 for an invalid status', async () => {
    const { job } = await setup();

    const res = await request(ctx.app).patch(`/api/jobs/${job.id}`).send({ status: 'paused' });

    expect(fieldErrors(res)).toEqual({ status: 'Choose a valid status' });
  });

  it('returns 400 when only the start moves past the stored end', async () => {
    const { job } = await setup();

    const res = await request(ctx.app).patch(`/api/jobs/${job.id}`).send({ scheduledStart: '2026-10-20' });

    expect(fieldErrors(res)).toEqual({ scheduledEnd: "The end date can't be before the start date" });
  });

  it('returns 400 for a negative price', async () => {
    const { job } = await setup();

    const res = await request(ctx.app).patch(`/api/jobs/${job.id}`).send({ price: -0.01 });

    expect(fieldErrors(res)).toEqual({ price: "The price can't be negative" });
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(ctx.app).patch(`/api/jobs/${UNKNOWN_ID}`).send({ title: 'X' });

    expect(res.status).toBe(404);
    expect(res.body as ApiErrorBody).toEqual({ error: { message: 'Job not found' } });
  });

  it('returns 404 for a malformed id', async () => {
    const res = await request(ctx.app).patch('/api/jobs/not-an-id').send({ title: 'X' });

    expect(res.status).toBe(404);
  });
});

describe('site address', () => {
  it("keeps its own copy when the customer's address changes later", async () => {
    const customer = await createCustomer('Ada Lovelace', { address: siteAddress });
    const job = await createJob({ title: 'Fix the sink', customerId: customer.id, siteAddress: customer.address });

    await request(ctx.app)
      .patch(`/api/customers/${customer.id}`)
      .send({ address: { street: '1 New St', city: 'Capital City' } })
      .expect(200);

    const reloaded = await request(ctx.app).get(`/api/jobs/${job.id}`);
    expect((reloaded.body as Job).siteAddress).toEqual(siteAddress);
  });

  it("shows the customer's new name in the summary", async () => {
    const customer = await createCustomer();
    const job = await createJob({ title: 'Fix the sink', customerId: customer.id });

    await request(ctx.app).patch(`/api/customers/${customer.id}`).send({ name: 'Ada King' }).expect(200);

    const reloaded = await request(ctx.app).get(`/api/jobs/${job.id}`);
    expect((reloaded.body as Job).customer).toEqual({ id: customer.id, name: 'Ada King' });
  });
});

describe('GET /api/jobs', () => {
  it('returns an empty list when there are no jobs', async () => {
    const res = await request(ctx.app).get('/api/jobs');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  async function seed() {
    const ada = await createCustomer('Ada Lovelace');
    const grace = await createCustomer('Grace Hopper');
    await createJob({ title: 'Ada 1', customerId: ada.id });
    await createJob({ title: 'Grace 1', customerId: grace.id, status: 'in_progress' });
    await createJob({ title: 'Ada 2', customerId: ada.id, status: 'in_progress' });
    return { ada, grace };
  }

  function titles(res: request.Response): string[] {
    expect(res.status).toBe(200);
    return (res.body as Job[]).map((job) => job.title);
  }

  it('lists every job, newest first, with customer summaries', async () => {
    const { ada } = await seed();

    const res = await request(ctx.app).get('/api/jobs');

    expect(titles(res)).toEqual(['Ada 2', 'Grace 1', 'Ada 1']);
    expect((res.body as Job[])[0].customer).toEqual({ id: ada.id, name: 'Ada Lovelace' });
  });

  it("filters by customer with ?customerId=", async () => {
    const { ada } = await seed();

    const res = await request(ctx.app).get('/api/jobs').query({ customerId: ada.id });

    expect(titles(res)).toEqual(['Ada 2', 'Ada 1']);
  });

  it('returns no jobs for an unknown or malformed customer id', async () => {
    await seed();

    expect(titles(await request(ctx.app).get('/api/jobs').query({ customerId: UNKNOWN_ID }))).toEqual([]);
    expect(titles(await request(ctx.app).get('/api/jobs').query({ customerId: 'nope' }))).toEqual([]);
  });

  it('filters by status with ?status=', async () => {
    await seed();

    const res = await request(ctx.app).get('/api/jobs').query({ status: 'in_progress' });

    expect(titles(res)).toEqual(['Ada 2', 'Grace 1']);
  });

  it('combines both filters', async () => {
    const { ada } = await seed();

    const res = await request(ctx.app).get('/api/jobs').query({ status: 'scheduled', customerId: ada.id });

    expect(titles(res)).toEqual(['Ada 1']);
  });

  it('returns 400 for an invalid status filter', async () => {
    const res = await request(ctx.app).get('/api/jobs').query({ status: 'paused' });

    expect(res.status).toBe(400);
    expect(res.body as ApiErrorBody).toEqual({
      error: { message: 'Invalid status filter', fields: { status: 'Choose a valid status' } },
    });
  });
});
