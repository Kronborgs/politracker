import fp from "fastify-plugin";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async function authPlugin(app: FastifyInstance) {
  app.decorate("requireAdmin", async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
      if ((request.user as { role?: string }).role !== "admin") {
        return reply.code(403).send({ error: "Admin role required" });
      }
    } catch {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });
});
