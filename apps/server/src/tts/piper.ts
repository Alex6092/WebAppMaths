import { spawn, type ChildProcess } from 'node:child_process';
import { createInterface } from 'node:readline';

interface Waiting {
  resolve: () => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
}

/**
 * Un processus Piper qui reste chargé en mémoire (charger une voix prend une demi-seconde).
 * Avec --json-input, il lit une ligne JSON par phrase ({ text, output_file }), écrit le fichier
 * WAV et répond par son chemin sur une ligne. Une seule phrase à la fois par processus.
 */
export class PiperProcess {
  private child: ChildProcess | null = null;
  private waiting: Waiting | null = null;
  /** Les dernières lignes d'erreur de Piper, pour le journal. */
  private stderr = '';

  constructor(
    private readonly command: string,
    private readonly args: string[],
    private readonly timeoutMs: number,
  ) {}

  get busy(): boolean {
    return this.waiting !== null;
  }

  private start(): ChildProcess {
    const child = spawn(this.command, this.args, { stdio: ['pipe', 'pipe', 'pipe'] });
    createInterface({ input: child.stdout! }).on('line', () => this.settle(null));
    child.stderr!.on('data', (chunk: Buffer) => {
      this.stderr = (this.stderr + chunk.toString()).slice(-2000);
    });
    child.stdin!.on('error', (error) => this.settle(error));
    child.on('error', (error) => {
      if (this.child === child) this.child = null;
      this.settle(error);
    });
    child.on('exit', (code, signal) => {
      if (this.child === child) this.child = null;
      const last = this.stderr.trim().split('\n').at(-1) ?? '';
      this.settle(new Error(`Piper s’est arrêté (${signal ?? `code ${code}`}) ${last}`.trim()));
    });
    this.child = child;
    return child;
  }

  /** Écrit la phrase dans outFile (WAV). */
  synth(text: string, outFile: string): Promise<void> {
    if (this.waiting) return Promise.reject(new Error('Piper est déjà occupé.'));
    const child = this.child ?? this.start();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.settle(new Error(`Piper n’a pas répondu en ${this.timeoutMs} ms.`));
        // Un processus bloqué est relancé à la prochaine phrase.
        this.stop();
      }, this.timeoutMs);
      this.waiting = { resolve, reject, timer };
      child.stdin!.write(`${JSON.stringify({ text, output_file: outFile })}\n`);
    });
  }

  private settle(error: Error | null): void {
    const waiting = this.waiting;
    if (!waiting) return;
    this.waiting = null;
    clearTimeout(waiting.timer);
    if (error) waiting.reject(error);
    else waiting.resolve();
  }

  stop(): void {
    const child = this.child;
    this.child = null;
    child?.kill();
  }
}
