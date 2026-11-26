import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), 'ecds-v1-'));
const revision = '44d8e569c620a1fced6be778775c7e28d0f06423';
const run = (command,args,cwd=temp) => execFileSync(command,args,{cwd,stdio:'inherit'});
try {
  run('git',['init','--quiet']);
  run('git',['fetch','--depth','1','https://github.com/erikacarvalh0/erikacarvalho-ds-v1.git',revision]);
  run('git',['checkout','--detach','FETCH_HEAD']);
  run('yarn',['install','--frozen-lockfile','--production=false']);
  run('npm',['pack']);
  const packs = readdirSync(temp).filter(name=>name.endsWith('.tgz'));
  if(packs.length!==1) throw Error('Expected exactly one package');
  run('npm',['install','--include=dev','--no-save','--package-lock=false',join(temp,packs[0])],root);
} finally { rmSync(temp,{recursive:true,force:true}); }
