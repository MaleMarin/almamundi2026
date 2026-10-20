export type MediaCaptureErrorKind = 'denied' | 'unsupported' | 'busy';

export function classifyMediaCaptureError(
  err: unknown,
  phase: 'getUserMedia' | 'recorder' | 'preview'
): MediaCaptureErrorKind {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return 'unsupported';
  }
  if (phase === 'recorder' && typeof MediaRecorder === 'undefined') {
    return 'unsupported';
  }

  const name =
    err && typeof err === 'object' && 'name' in err ? String((err as { name?: string }).name) : '';

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return 'denied';
  if (name === 'NotSupportedError' || name === 'SecurityError' || name === 'TypeError') {
    return 'unsupported';
  }
  if (
    name === 'NotFoundError' ||
    name === 'NotReadableError' ||
    name === 'TrackStartError' ||
    name === 'AbortError' ||
    name === 'OverconstrainedError'
  ) {
    return 'busy';
  }
  if (phase === 'preview' || phase === 'recorder') return 'busy';
  return 'denied';
}
