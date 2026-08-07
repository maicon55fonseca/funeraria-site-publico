import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = join(process.cwd(), 'dist', 'site', 'browser');
const forbidden = [/localhost:\d+/i, /127\.0\.0\.1/i, /http:\/\/localhost/i];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(js|html|css|mjs)$/i.test(name)) out.push(p);
  }
  return out;
}

let failed = false;
for (const file of walk(root)) {
  const text = readFileSync(file, 'utf8');
  for (const re of forbidden) {
    if (re.test(text)) {
      // app-config de dev não deve existir no bundle; permitir só se for comentário improvável
      console.error(`[verify:prod] URL local encontrada em ${file} (padrão ${re})`);
      failed = true;
    }
  }
}

const appConfig = join(root, 'app-config.js');
const cfg = readFileSync(appConfig, 'utf8');
if (!cfg.includes('funeraria-backend-production.up.railway.app')) {
  console.error('[verify:prod] app-config.js sem API Railway de produção');
  failed = true;
}
if (/localhost|127\.0\.0\.1/i.test(cfg)) {
  console.error('[verify:prod] app-config.js contém localhost');
  failed = true;
}

if (failed) {
  process.exit(1);
}
console.log('[verify:prod] OK — build sem localhost; API Railway presente em app-config.js');
