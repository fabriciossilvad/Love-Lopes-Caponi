import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    adminAccessToken: string;
    admin: {
      userId: string;
      email: string | null;
      name: string;
      role: string;
    };
  }
}
