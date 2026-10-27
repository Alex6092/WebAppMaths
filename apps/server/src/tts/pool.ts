import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { PiperProcess } from './piper';

/** Trop de phrases en attente : le client se rabat sur la voix du navigateur. */
export class TtsBusyError extends Error {
  constructor() {
    super('Trop de phrases en attente.');
  }
}

export interface PoolOptions {
  /** Le programme Piper, et les arguments à mettre avant les nôtres (pour les tests). */
  command: string;
  commandArgs?: string[];
  /** Le fichier .onnx de chaque voix. */
  models: Record<string, string>;
  /** Le nombre de phrases fabriquées en même temps (un cœur chacune). */
  workers: number;
  /** Le nombre de phrases qui peuvent attendre leur tour. */
  queueMax: number;
  timeoutMs: number;
  /** Où Piper écrit ses fichiers avant qu'on les lise. */
  tmpDir: string;
}

interface Job {
  voice: string;
  text: string;
  resolve: (audio: Buffer) => void;
  reject: (error: Error) => void;
}

/**
 * Le groupe de workers : au plus `workers` phrases en même temps, les autres attendent dans une
 * file plafonnée. Chaque voix a ses processus Piper, lancés à la première demande puis gardés.
 */
export class TtsPool {
  private readonly idle = new Map<string, PiperProcess[]>();
  private readonly all: PiperProcess[] = [];
  private readonly queue: Job[] = [];
  private running = 0;
  private closed = false;

  constructor(private readonly options: PoolOptions) {
    mkdirSync(options.tmpDir, { recursive: true });
  }

  /** Les phrases en cours et en attente (pour le contrôle de santé). */
  get load(): { running: number; waiting: number } {
    return { running: this.running, waiting: this.queue.length };
  }

  synth(voice: string, text: string): Promise<Buffer> {
    if (this.closed) return Promise.reject(new Error('Le service de voix est arrêté.'));
    if (!this.options.models[voice]) return Promise.reject(new Error(`Voix inconnue : ${voice}`));
    return new Promise((resolve, reject) => {
      const job = { voice, text, resolve, reject };
      if (this.running < this.options.workers) void this.run(job);
      else if (this.queue.length < this.options.queueMax) this.queue.push(job);
      else reject(new TtsBusyError());
    });
  }

  private process(voice: string): PiperProcess {
    const ready = this.idle.get(voice)?.pop();
    if (ready) return ready;
    const { command, commandArgs = [], models, timeoutMs } = this.options;
    const piper = new PiperProcess(
      command,
      [...commandArgs, '--model', models[voice]!, '--json-input', '--quiet'],
      timeoutMs,
    );
    this.all.push(piper);
    return piper;
  }

  private async run(job: Job): Promise<void> {
    this.running++;
    const piper = this.process(job.voice);
    const file = join(this.options.tmpDir, `${randomUUID()}.wav`);
    try {
      await piper.synth(job.text, file);
      job.resolve(await readFile(file));
    } catch (error) {
      job.reject(error as Error);
    } finally {
      await rm(file, { force: true });
      this.running--;
      if (!this.closed) {
        this.idle.set(job.voice, [...(this.idle.get(job.voice) ?? []), piper]);
        const next = this.queue.shift();
        if (next) void this.run(next);
      }
    }
  }

  close(): void {
    this.closed = true;
    for (const job of this.queue.splice(0)) job.reject(new Error('Le service de voix est arrêté.'));
    for (const piper of this.all) piper.stop();
  }
}
