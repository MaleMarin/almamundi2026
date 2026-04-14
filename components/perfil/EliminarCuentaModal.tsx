'use client';

import { useState, useCallback } from 'react';
import type { CSSProperties } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  deleteField,
  getDocs,
  query,
  where,
  writeBatch,
  type DocumentReference,
} from 'firebase/firestore';
import { deleteUser, getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase/client';
import { clearSavedCollection } from '@/lib/collection';

const STORIES = 'stories';
const USERS = 'users';
const MUESTRAS = 'muestras';
const CHUNK = 400;

async function batchDeleteRefs(refs: DocumentReference[]) {
  if (!db || refs.length === 0) return;
  for (let i = 0; i < refs.length; i += CHUNK) {
    const batch = writeBatch(db);
    refs.slice(i, i + CHUNK).forEach((r) => batch.delete(r));
    await batch.commit();
  }
}

async function batchUpdateStories(
  updates: { ref: DocumentReference; data: Record<string, unknown> }[],
) {
  if (!db || updates.length === 0) return;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const batch = writeBatch(db);
    updates.slice(i, i + CHUNK).forEach(({ ref, data }) => batch.update(ref, data));
    await batch.commit();
  }
}

export type EliminarCuentaModalProps = {
  onClose: () => void;
};

export function EliminarCuentaModal({ onClose }: EliminarCuentaModalProps) {
  const [paso, setPaso] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cancelStyle: CSSProperties = {
    background: '#e6e9ee',
    border: 'none',
    color: '#9299a8',
    borderRadius: 100,
    padding: '10px 24px',
    fontSize: 12,
    boxShadow: '3px 3px 6px #c4c7cd, -3px -3px 6px #ffffff',
    cursor: 'pointer',
  };

  const dangerBtnStyle: CSSProperties = {
    background: '#C62828',
    color: 'white',
    border: 'none',
    borderRadius: 100,
    padding: '10px 24px',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
  };

  const runDelete = useCallback(async () => {
    setErrorMsg(null);
    if (!db) {
      setErrorMsg(
        'Ocurrió un error. Por favor intente de nuevo o contacte a hola@precisar.cl',
      );
      return;
    }
    try {
      setLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('No hay usuario autenticado');
      const uid = user.uid;

      const guardadasSnap = await getDocs(collection(db, USERS, uid, 'guardadas'));
      const guardadasRefs = guardadasSnap.docs.map((d) => d.ref);

      const muestrasSnap = await getDocs(
        query(collection(db, MUESTRAS), where('autorId', '==', uid)),
      );
      const muestrasRefs = muestrasSnap.docs.map((d) => d.ref);

      const pendingSnap = await getDocs(
        query(collection(db, STORIES), where('autor.id', '==', uid), where('status', '==', 'pending')),
      );
      const pendingRefs = pendingSnap.docs.map((d) => d.ref);

      const publishedSnap = await getDocs(
        query(collection(db, STORIES), where('autor.id', '==', uid), where('status', '==', 'published')),
      );
      const now = new Date().toISOString();
      const publishedUpdates = publishedSnap.docs.map((d) => ({
        ref: d.ref,
        data: {
          'autor.nombre': 'Autor anónimo',
          'autor.avatar': deleteField(),
          'autor.id': deleteField(),
          updatedAt: now,
        } as Record<string, unknown>,
      }));

      await batchDeleteRefs(guardadasRefs);
      await batchDeleteRefs(muestrasRefs);
      await batchDeleteRefs(pendingRefs);
      await batchUpdateStories(publishedUpdates);

      await deleteDoc(doc(db, USERS, uid));

      clearSavedCollection();

      await deleteUser(user);

      window.location.href = '/?cuenta=eliminada';
    } catch (err: unknown) {
      console.error('Error al eliminar cuenta:', err);
      setLoading(false);
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code: string }).code)
          : '';
      if (code === 'auth/requires-recent-login') {
        setErrorMsg('Por seguridad, cierre sesión, vuelva a ingresar y repita el proceso.');
        return;
      }
      setErrorMsg(
        'Ocurrió un error. Por favor intente de nuevo o contacte a hola@precisar.cl',
      );
    }
  }, []);

  const overlay: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    zIndex: 9000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const panel: CSSProperties = {
    background: '#e6e9ee',
    borderRadius: 20,
    boxShadow: '12px 12px 24px #c4c7cd, -12px -12px 24px #ffffff',
    padding: 36,
    maxWidth: 440,
    width: '90%',
    boxSizing: 'border-box',
  };

  const titleStyle: CSSProperties = {
    fontSize: 22,
    fontWeight: 800,
    color: '#1a1f2a',
    letterSpacing: '-0.02em',
    marginBottom: 16,
    marginTop: 0,
  };

  const paraStyle: CSSProperties = {
    fontSize: 14,
    color: '#5a6070',
    lineHeight: 1.75,
    marginBottom: 24,
    marginTop: 0,
  };

  const rowStyle: CSSProperties = {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 24,
    flexWrap: 'wrap',
  };

  return (
    <div
      style={overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={paso === 1 ? 'eliminar-cuenta-titulo' : undefined}
      aria-label={paso === 2 ? 'Confirmar eliminación de cuenta' : undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        {paso === 1 ? (
          <>
            <h2 id="eliminar-cuenta-titulo" style={titleStyle}>
              ¿Eliminar tu cuenta?
            </h2>
            <p style={paraStyle}>
              Esta acción es permanente. Se eliminarán:
              <br />
              <br />
              - Tu perfil y datos personales
              <br />
              - Las historias pendientes de publicación
              <br />
              - Tu colección guardada
              <br />
              <br />
              Esta acción no se puede deshacer.
            </p>
            {errorMsg ? (
              <p style={{ ...paraStyle, marginBottom: 12, color: '#C62828' }} role="alert">
                {errorMsg}
              </p>
            ) : null}
            <div style={rowStyle}>
              <button type="button" style={cancelStyle} disabled={loading} onClick={onClose}>
                Cancelar
              </button>
              <button
                type="button"
                style={dangerBtnStyle}
                disabled={loading}
                onClick={() => setPaso(2)}
              >
                Sí, eliminar mi cuenta
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ ...paraStyle, marginBottom: 12 }}>
              Para confirmar, escriba la palabra ELIMINAR en mayúsculas:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              disabled={loading}
              style={{
                background: '#e6e9ee',
                border: '1.5px solid #e6e9ee',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 14,
                boxShadow: 'inset 3px 3px 6px #c4c7cd, inset -3px -3px 6px #ffffff',
                width: '100%',
                marginBottom: 16,
                boxSizing: 'border-box',
                color: '#1a1f2a',
              }}
            />
            {errorMsg ? (
              <p style={{ ...paraStyle, marginTop: 0, marginBottom: 12, color: '#C62828' }} role="alert">
                {errorMsg}
              </p>
            ) : null}
            <div style={rowStyle}>
              <button type="button" style={cancelStyle} disabled={loading} onClick={() => setPaso(1)}>
                Volver
              </button>
              <button
                type="button"
                disabled={confirmText !== 'ELIMINAR' || loading}
                onClick={() => void runDelete()}
                style={{
                  ...dangerBtnStyle,
                  opacity: confirmText !== 'ELIMINAR' || loading ? 0.4 : 1,
                  cursor: confirmText !== 'ELIMINAR' || loading ? 'not-allowed' : 'pointer',
                }}
              >
                Confirmar eliminación
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
