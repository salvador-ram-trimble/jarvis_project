import fs from 'node:fs';
import path from 'node:path';
import express, { type Express } from 'express';
import type { Connection } from 'mongoose';
import { errorHandler, notFound } from './errors.js';
import { customerModel } from './models/customer.js';
import { customersRouter } from './routes/customers.js';
import { healthRouter } from './routes/health.js';

export interface AppOptions {
  /** The Mongoose connection every model is registered on. */
  connection: Connection;
  /** Folder with the built React app. When it exists, Express serves it for every non-API route. */
  clientDistPath?: string;
}

export function createApp({ connection, clientDistPath }: AppOptions): Express {
  const app = express();

  app.use(express.json());

  app.use('/api/health', healthRouter(connection));
  app.use('/api/customers', customersRouter(customerModel(connection)));
  app.use('/api', notFound);

  if (clientDistPath && fs.existsSync(clientDistPath)) {
    const indexHtml = path.join(clientDistPath, 'index.html');
    app.use(express.static(clientDistPath));
    // Client-side routes such as /customers must load the React app on refresh.
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(indexHtml);
    });
  }

  app.use(errorHandler);

  return app;
}
