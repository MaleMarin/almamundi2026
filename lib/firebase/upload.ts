'use client';

/**
 * Subida server-side vía /api/submissions/story-media (Admin SDK, objeto privado).
 * Devuelve URL firmada temporal y path interno para auditoría / curación.
 */
export type StoryMediaUploadResult = {
  readUrl: string;
  storagePath: string;
};

export async function uploadFileToStorage(
  file: File | Blob,
  _pathPrefix: string,
  filename?: string
): Promise<StoryMediaUploadResult> {
  const name =
    filename ||
    (file instanceof File ? file.name : 'media');
  const blob =
    file instanceof File
      ? file
      : new File([await file.arrayBuffer()], name, {
          type: file.type || 'application/octet-stream',
        });

  const fd = new FormData();
  fd.append('file', blob);

  const res = await fetch('/api/submissions/story-media', {
    method: 'POST',
    body: fd,
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    signedReadUrl?: string;
    storagePath?: string;
  };
  if (!res.ok || !data.signedReadUrl || !data.storagePath) {
    throw new Error(data.error || `upload_${res.status}`);
  }
  return {
    readUrl: data.signedReadUrl,
    storagePath: data.storagePath,
  };
}
