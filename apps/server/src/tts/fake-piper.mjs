// Un faux Piper pour les tests : même protocole (une ligne JSON par phrase, le chemin en réponse).
// « plante » dans le texte arrête le processus ; « lent » attend 200 ms. Chaque phrase fabriquée
// est notée dans le fichier FAKE_PIPER_LOG.
import { appendFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { createInterface } from 'node:readline';

const model = basename(process.argv[process.argv.indexOf('--model') + 1] ?? '?');

createInterface({ input: process.stdin }).on('line', async (line) => {
  const { text, output_file: out } = JSON.parse(line);
  if (text.includes('plante')) process.exit(3);
  if (text.includes('lent')) await new Promise((r) => setTimeout(r, 200));
  if (process.env.FAKE_PIPER_LOG) appendFileSync(process.env.FAKE_PIPER_LOG, `${model}|${text}\n`);
  writeFileSync(out, Buffer.concat([Buffer.from('RIFF'), Buffer.from(`${model}:${text}`)]));
  process.stdout.write(`${out}\n`);
});
