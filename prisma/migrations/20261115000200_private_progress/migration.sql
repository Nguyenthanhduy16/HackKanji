-- Private, unverified client backups. Never used to award XP or rank users.
CREATE TABLE "ProgressSnapshot" (
  "userId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "data" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProgressSnapshot_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "ProgressSnapshot_version_positive" CHECK ("version" > 0),
  CONSTRAINT "ProgressSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
