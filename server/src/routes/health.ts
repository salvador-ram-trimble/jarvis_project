import { Router } from 'express';
import mongoose, { type Connection } from 'mongoose';
import type { HealthResponse } from '@jarvis/shared';

export function healthRouter(connection: Connection): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const connected = connection.readyState === mongoose.ConnectionStates.connected;
    const body: HealthResponse = connected
      ? { status: 'ok', database: 'connected' }
      : { status: 'error', database: 'disconnected' };
    res.status(connected ? 200 : 503).json(body);
  });

  return router;
}
