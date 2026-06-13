import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import * as dotenv from 'dotenv';
import { setupRoutes } from './routes';
import { db } from './db';

dotenv.config();

const server = Fastify({
  logger: true,
});

server.register(cors, {
  origin: '*',
});

server.register(multipart);

// Register routes
server.register(setupRoutes, { prefix: '/api/v1' });

server.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date() };
});

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
