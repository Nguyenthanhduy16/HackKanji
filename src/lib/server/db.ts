import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { nhaikanjiPrisma?: PrismaClient };

export function getDb(): PrismaClient {
  if (!process.env.DATABASE_URL) throw new Error("Database is not configured");
  if (!globalForPrisma.nhaikanjiPrisma) {
    globalForPrisma.nhaikanjiPrisma = new PrismaClient({ log: [] });
  }
  return globalForPrisma.nhaikanjiPrisma;
}

// Postgres aborts one of two conflicting serializable transactions. Retry the
// complete operation, including receipt/ownership checks, never just the write.
export async function transaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await getDb().$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 10_000,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === "P2034" || error.code === "P2002") && attempt < 2) continue;
      throw error;
    }
  }
  throw new Error("Transaction retry limit reached");
}
