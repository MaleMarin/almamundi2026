'use client';

/**
 * Subida directa a Firebase Storage (sesión resumable firmada).
 * El archivo no pasa por Vercel. Las reglas del bucket siguen en deny.
 */
export type StoryMediaUploadResult = {
  readUrl: string;
  storagePath: string;
};

const CHUNK = 8 * 1024 * 1024;

function inferContentType(blob: Blob, filename: string): string {
  const declared =
    (blob.type || '').split(';')[0]?.trim().toLowerCase() || '';
  if (declared && declared !== 'application/octet-stream') return declared;
  const n = filename.toLowerCase();
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
  if (n.endsWith('.webp')) return 'image/webp';
  if (n.endsWith('.gif')) return 'image/gif';
  if (n.endsWith('.mp4')) return 'video/mp4';
  if (n.endsWith('.mov')) return 'video/quicktime';
  if (n.endsWith('.webm')) return 'video/webm';
  if (n.endsWith('.mp3')) return 'audio/mpeg';
  if (n.endsWith('.m4a')) return 'audio/mp4';
  if (n.endsWith('.wav')) return 'audio/wav';
  return declared || 'application/octet-stream';
}

async function putResumable(
  uploadUrl: string,
  blob: Blob,
  contentType: string
): Promise<void> {
  const total = blob.size;
  let offset = 0;
  while (offset < total) {
    const end = Math.min(offset + CHUNK, total);
    const chunk = blob.slice(offset, end);
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Range': `bytes ${offset}-${end - 1}/${total}`,
      },
      body: chunk,
    });
    if (res.status === 308) {
      offset = end;
      continue;
    }
    if (!res.ok) {
      throw new Error(`upload_${res.status}`);
    }
    offset = end;
  }
}

export async function uploadFileToStorage(
  file: File | Blob,
  _pathPrefix: string,
  filename?: string
): Promise<StoryMediaUploadResult> {
  const name =
    filename || (file instanceof File ? file.name : 'media');
  const blob: Blob = file;
  const mime = inferContentType(blob, name);

  const init = await fetch('/api/submissions/story-media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: name,
      contentType: mime,
      size: blob.size,
    }),
  });
  const initData = (await init.json().catch(() => ({}))) as {
    error?: string;
    uploadUrl?: string;
    storagePath?: string;
  };
  if (!init.ok || !initData.uploadUrl || !initData.storagePath) {
    throw new Error(initData.error || `upload_${init.status}`);
  }

  await putResumable(initData.uploadUrl, blob, mime);

  const done = await fetch('/api/submissions/story-media/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storagePath: initData.storagePath,
      contentType: mime,
    }),
  });
  const data = (await done.json().catch(() => ({}))) as {
    error?: string;
    signedReadUrl?: string;
    storagePath?: string;
  };
  if (!done.ok || !data.signedReadUrl || !data.storagePath) {
    throw new Error(data.error || `upload_${done.status}`);
  }
  return {
    readUrl: data.signedReadUrl,
    storagePath: data.storagePath,
  };
}
