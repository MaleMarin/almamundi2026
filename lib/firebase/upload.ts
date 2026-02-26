'use client';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/client';

/**
 * Sube un archivo o blob a Firebase Storage y devuelve la URL pública.
 * pathPrefix ej: "submissions" → path será submissions/{timestamp}-{filename}
 */
export async function uploadFileToStorage(
  file: File | Blob,
  pathPrefix: string,
  filename?: string
): Promise<string> {
  const name = filename || (file instanceof File ? file.name : 'media');
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  const path = `${pathPrefix}/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, path);
  const blob = file instanceof Blob ? file : new Blob([await file.arrayBuffer()], { type: file.type });
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}
