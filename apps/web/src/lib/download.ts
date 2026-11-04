import { ApiError } from './api';

/**
 * Télécharge un fichier préparé par le serveur (export JSON, tableur CSV) : il arrive avec le
 * cookie de session, puis s'enregistre sous ce nom.
 */
export async function downloadFile(path: string, filename: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`api/${path}`, { credentials: 'same-origin' });
  } catch {
    throw new ApiError(
      0,
      'offline',
      'Pas de connexion à Internet. Vérifie le Wi-Fi puis réessaie.',
    );
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new ApiError(
      res.status,
      data.error ?? 'network',
      data.message ?? 'Le serveur ne répond pas.',
    );
  }
  // Le nom donné par le serveur (Content-Disposition), sinon celui proposé ici.
  const given = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') ?? '')?.[1];
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = given ?? filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
