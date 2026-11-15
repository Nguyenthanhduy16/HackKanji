import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {PrismaClient} from '@prisma/client';
import {localDatabaseUrl, projectRoot} from '../prisma/local-postgres';
import {emptyProgressData} from '../src/lib/account-data';

export async function setupAccountDb() {
  const admin = new PrismaClient({datasourceUrl: localDatabaseUrl('postgres')});
  const name = 'nhaikanji_account_test';
  const exists = await admin.$queryRaw<{datname: string}[]>`SELECT datname FROM pg_database WHERE datname = ${name}`;
  if (!exists.length) await admin.$executeRawUnsafe('CREATE DATABASE nhaikanji_account_test');
  await admin.$disconnect();
  process.env.DATABASE_URL = localDatabaseUrl(name);
  const migrate = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {cwd: projectRoot, env: process.env, encoding: 'utf8'});
  assert.equal(migrate.status, 0, 'Account test migrations must succeed');
}
export async function verifyAccountDb() {
  await setupAccountDb();
  const {saveProgress, readProgress} = await import('../src/lib/server/progress');
  const {getDb} = await import('../src/lib/server/db');
  const db = getDb();
  const ids = [randomUUID(), randomUUID()];
  try {
    for (const id of ids) await db.user.create({data: {id, isPublic: false}});
    const data = emptyProgressData(); data.study.xp = 999999;
    assert.equal(await readProgress(ids[0]), null);
    const first = await saveProgress(ids[0], 0, data);
    assert.equal(first.version, 1);
    assert.deepEqual((await readProgress(ids[0]))?.data, data);
    assert.equal(await readProgress(ids[1]), null);
    const outcomes = await Promise.allSettled([saveProgress(ids[0], 1, data), saveProgress(ids[0], 1, data)]);
    assert.equal(outcomes.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal((await readProgress(ids[0]))?.version, 2);
    await assert.rejects(saveProgress(ids[0], 0, data), {status: 409});
    const unchanged = await db.user.findUniqueOrThrow({where: {id: ids[0]}});
    assert.equal(unchanged.xp, 0);
    assert.equal(unchanged.dango, 50);
    assert.equal(unchanged.level, 1);
    assert.equal(await db.inventory.count({where: {userId: ids[0]}}), 0);
    assert.equal(await db.studyDay.count({where: {userId: ids[0]}}), 0);
    console.log('PASS PostgreSQL ownership, round-trip, concurrent version lock, stale writes, untrusted XP isolation');
  } finally {
    await db.user.deleteMany({where: {id: {in: ids}}});
    assert.equal(await db.user.count({where: {id: {in: ids}}}), 0);
    await db.$disconnect();
  }
}
if (process.argv[1]?.endsWith('account-database.ts')) verifyAccountDb().catch(error => {console.error(error.name, error.message); process.exitCode = 1;});
