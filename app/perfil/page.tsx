'use client';

/**
 * /perfil — Redirige al perfil propio si estás autenticado.
 * Si no hay sesión → redirect('/').
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth } from '@/lib/firebase/client';
import { db } from '@/lib/firebase/client';
import { SITE_FONT_STACK } from '@/lib/typography';
import { hardNavigateTo } from '@/lib/home-hard-nav';

export default function PerfilRedirectPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'redirect' | 'done'>('loading');

  useEffect(() => {
    if (!auth) {
      hardNavigateTo('/');
      return;
    }
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        hardNavigateTo('/');
        setStatus('done');
        return;
      }
      if (!db) {
        hardNavigateTo('/');
        setStatus('done');
        return;
      }
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const username = userSnap.exists() ? (userSnap.data()?.username as string) : null;
        if (username) {
          router.replace(`/u/${username}`);
        } else {
          hardNavigateTo('/');
        }
      } catch {
        hardNavigateTo('/');
      }
      setStatus('done');
    });
    return () => unsub();
  }, [router]);

  if (status === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#e8ecf0',
          fontFamily: SITE_FONT_STACK,
          color: '#4a5568',
          padding: '1.5rem',
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando...</div>
      </div>
    );
  }
  return null;
}
