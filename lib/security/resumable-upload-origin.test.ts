import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isAcceptedResumableOrigin,
  resolveResumableUploadOrigin,
} from '../resumable-upload-origin';

const PREVIEW_OK = 'https://almamundi2026-git-preview-adenda-revision-precisar.vercel.app';
const OTHER_VERCEL = 'https://otro-proyecto-abc123-equipo.vercel.app';

describe('resumable upload origin', () => {
  it('origin de preview válido se acepta fuera de producción', () => {
    assert.equal(isAcceptedResumableOrigin(PREVIEW_OK, 'preview'), true);
    assert.equal(
      resolveResumableUploadOrigin({ requestOrigin: PREVIEW_OK, vercelEnv: 'preview' }),
      PREVIEW_OK
    );
  });

  it('el mismo origin de preview se rechaza en producción', () => {
    assert.equal(isAcceptedResumableOrigin(PREVIEW_OK, 'production'), false);
    assert.equal(
      resolveResumableUploadOrigin({ requestOrigin: PREVIEW_OK, vercelEnv: 'production' }),
      'https://www.almamundi.org'
    );
  });

  it('origin de otro proyecto *.vercel.app se rechaza siempre', () => {
    assert.equal(isAcceptedResumableOrigin(OTHER_VERCEL, 'preview'), false);
    assert.equal(isAcceptedResumableOrigin(OTHER_VERCEL, 'production'), false);
    assert.equal(isAcceptedResumableOrigin(OTHER_VERCEL, undefined), false);
  });
});
