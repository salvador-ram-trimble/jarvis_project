import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { type Connection } from 'mongoose';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';

/**
 * Starts an in-memory MongoDB for the current test file and builds the app against it.
 * Every collection is emptied before each test.
 */
export function setupTestApp() {
  let mongo: MongoMemoryServer;
  const context = {} as { connection: Connection; app: ReturnType<typeof createApp> };

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    context.connection = await mongoose.createConnection(mongo.getUri()).asPromise();
    context.app = createApp({ connection: context.connection });
  });

  beforeEach(async () => {
    const collections = await context.connection.db!.collections();
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
  });

  afterAll(async () => {
    await context.connection?.close();
    await mongo?.stop();
  });

  return context;
}
