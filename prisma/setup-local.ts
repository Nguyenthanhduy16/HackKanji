import {spawnSync} from 'node:child_process';
import {localDatabaseUrl,projectRoot} from './local-postgres';
const env={...process.env,DATABASE_URL:localDatabaseUrl()};
for(const args of [['node_modules/prisma/build/index.js','migrate','deploy'],['--import','tsx','prisma/seed.ts']]){
 const child=spawnSync(process.execPath,args,{cwd:projectRoot,env,stdio:'inherit'});
 if(child.status!==0)process.exit(child.status||1);
}
