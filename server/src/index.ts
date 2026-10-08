import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { createApp } from './app.js';

try {
  // Local development reads server/.env. On Azure the values come from App Service settings.
  process.loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)));
} catch {
  // No .env file: rely on the environment.
}

const mongoUri = process.env.MONGODB_URI;
const port = Number(process.env.PORT ?? 3001);

if (!mongoUri) {
  console.error('MONGODB_URI is not set. Copy server/.env.example to server/.env and fill it in.');
  process.exit(1);
}

const connection = mongoose.createConnection(mongoUri);
connection.on('connected', () => console.log('Connected to MongoDB'));
connection.on('disconnected', () => console.warn('Disconnected from MongoDB'));
connection.on('error', (err: Error) => console.error('MongoDB connection error:', err.message));

const clientDistPath = fileURLToPath(new URL('../../client/dist', import.meta.url));
const app = createApp({ connection, clientDistPath });

// Listen right away so /api/health can report a database problem instead of the app failing to start.
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
