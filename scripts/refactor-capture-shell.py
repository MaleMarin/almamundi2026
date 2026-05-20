#!/usr/bin/env python3
"""One-off refactor: wrap StoryCaptureStep capture flow in FormatCaptureEditorialShell."""
from pathlib import Path
import re

p = Path('components/subir/StoryCaptureStep.tsx')
text = p.read_text()

text = text.replace(
    "import { AmUploadModalShell } from '@/components/subir/AmUploadModalShell';",
    "import { FormatCaptureEditorialShell } from '@/components/subir/FormatCaptureEditorialShell';",
)

text = text.replace(
    """  const isFotoCapturePanel = format === 'foto' && flowStage === 'media';

  const continueButtonLabel""",
    """  const isCaptureFlow = flowStage === 'welcome' || flowStage === 'media';

  const continueButtonLabel""",
)
text = text.replace(
    "  const showContinueButton = flowStage !== 'welcome' && !isFotoCapturePanel;\n\n",
    "",
)

start_marker = "      {format === 'texto' && flowStage === 'welcome' && ("
end_marker = "      {!isFotoCapturePanel && ("
start = text.index(start_marker)
end = text.index(end_marker)
capture_body = text[start:end]

foto_old = """      {format === 'foto' && flowStage === 'media' && (
        <motion.div className="mx-auto w-full max-w-[620px] space-y-3">"""

if foto_old not in capture_body:
    foto_old = foto_old.replace('motion.div', 'div')

foto_block_start = capture_body.find("{format === 'foto' && flowStage === 'media'")
foto_block_end = capture_body.find("{format === 'video' && flowStage === 'welcome'")
if foto_block_start >= 0 and foto_block_end > foto_block_start:
    capture_body = (
        capture_body[:foto_block_start]
        + """      {format === 'foto' && flowStage === 'media' && (
        <>
          <UploadModalFotoCapture
            photoFiles={photoFiles}
            photoPreviews={photoPreviews}
            onAddFiles={addPhotoFiles}
            onRemove={removePhotoAt}
            inlineError={localErr || undefined}
          />
          <motion.div className="mt-6 space-y-2">
            <label htmlFor="capture-foto-caption" className="block text-sm font-medium text-[#1c1c2e]">
              Contexto de tus fotos (opcional)
            </label>
            <textarea
              id="capture-foto-caption"
              value={fotoCaption}
              onChange={(e) => setFotoCaption(e.target.value)}
              rows={5}
              placeholder="¿Qué guardan estas imágenes? Quién aparece, dónde fueron, por qué importan…"
              className={amStyles.amTextarea}
              aria-label="Contexto de las fotos"
            />
          </motion.div>
        </>
      )}

"""
        + capture_body[foto_block_end:]
    )
    capture_body = capture_body.replace('motion.div', 'motion.div')

capture_body = capture_body.replace('motion.div', 'motion.div')

video_welcome_new = """      {format === 'video' && flowStage === 'welcome' && (
        <>
          <button
            type="button"
            onClick={() => {
              setVideoMode('grabar');
              setFlowStage('media');
              setPhase('idle');
              setLocalErr('');
              setVideoFile(null);
              setVideoUrl('');
              clearReviewUrl();
              setRecordedBlob(null);
              setRecordedMime('');
            }}
            className={amStyles.amModalBtnPrimary}
          >
            {modalCopy.primaryCta}
          </button>
          {modalCopy.uploadLabel ? (
            <button
              type="button"
              className={amStyles.amModalUploadLabel}
              onClick={() => {
                setVideoMode('enlace');
                setFlowStage('media');
                setLocalErr('');
                stopStream();
                setRecordedBlob(null);
                setRecordedMime('');
                clearReviewUrl();
                setPhase('idle');
                setRecording(false);
              }}
            >
              {modalCopy.uploadLabel}
            </button>
          ) : null}
        </>
      )}

      {format === 'video' && flowStage === 'media'"""

capture_body, n = re.subn(
    r"      \{format === 'video' && flowStage === 'welcome' && \(\n.*?\n      \)\}\n\n      \{format === 'video' && flowStage === 'media'",
    video_welcome_new,
    capture_body,
    count=1,
    flags=re.DOTALL,
)
print('video welcome:', n)

capture_body = capture_body.replace(
    'className="w-full py-4 md:py-5 rounded-full font-bold text-base text-white"\n            style={{ background: orangeCta, boxShadow: \'0 8px 24px rgba(255,69,0,0.35)\' }}\n          >\n            Comenzar a escribir',
    'className={amStyles.amModalBtnPrimary}\n          >\n            Comenzar a escribir',
)

capture_body = capture_body.replace(
    'className="w-full py-4 md:py-5 rounded-full font-bold text-base md:text-lg text-white"\n                  style={{ background: orangeCta, boxShadow: \'0 8px 32px rgba(255,69,0,0.35)\' }}\n                >\n                  Activar cámara',
    'className={amStyles.amModalBtnPrimary}\n                >\n                  Activar cámara',
)

capture_body = capture_body.replace(
    'className="w-full py-3 md:py-3.5 rounded-full font-semibold text-sm md:text-base text-white"\n                      style={{ background: orangeCta, boxShadow: \'0 6px 20px rgba(255,69,0,0.3)\' }}\n                    >\n                      Activar micrófono',
    'className={amStyles.amModalBtnPrimary}\n                    >\n                      Activar micrófono',
)

welcome_start = capture_body.find("{flowStage === 'welcome' && (\n            <div className=\"grid gap-4 sm:grid-cols-2")
if welcome_start >= 0:
    welcome_end = capture_body.find("          )}\n\n          {flowStage === 'media' && (", welcome_start)
    if welcome_end > welcome_start:
        capture_body = (
            capture_body[:welcome_start]
            + """{flowStage === 'welcome' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setAudioMode('grabar');
                  setFlowStage('media');
                  setPhase('idle');
                  setLocalErr('');
                }}
                className={amStyles.amModalBtnPrimary}
              >
                {modalCopy.primaryCta}
              </button>
              {modalCopy.uploadLabel ? (
                <button
                  type="button"
                  className={amStyles.amModalUploadLabel}
                  onClick={() => {
                    setAudioMode('archivo');
                    setFlowStage('media');
                    setLocalErr('');
                  }}
                >
                  {modalCopy.uploadLabel}
                </button>
              ) : null}
            </>
          )}

          """
            + capture_body[welcome_end + len("          )}\n\n          ") :]
        )

details_start = text.index("      {flowStage === 'storyDetails' && (")
details_block = text[details_start:start]

before_return = text[: text.index("  return (\n    <section")]
footer_part = text[end:]
footer_part = footer_part.replace(
    "{!isFotoCapturePanel && (",
    "{(flowStage === 'storyDetails' || flowStage === 'personDetails') && (",
)
footer_part = footer_part.replace(
    "      {showContinueButton && (",
    "      {(flowStage === 'storyDetails' || flowStage === 'personDetails') && (",
)

early_return = f"""  if (isCaptureFlow) {{
    return (
      <FormatCaptureEditorialShell
        copy={{modalCopy}}
        titlePreLine={{format === 'foto' || format === 'texto'}}
        onClose={{() => {{
          router.replace('/subir');
          setLocalErr('');
        }}}}
        continueEnabled={{canContinue()}}
        onContinue={{handleContinue}}
        continueLabel={{continueButtonLabel}}
      >
        {{localErr ? <p className={{amStyles.amModalInlineError}} role="alert">{{localErr}}</p> : null}}
{capture_body}
      </FormatCaptureEditorialShell>
    );
  }}

  return (
    <section className="space-y-8 md:space-y-10" aria-label="Captura de tu historia" aria-current="step">
      <header className="space-y-4 md:space-y-5">
        <p className="text-sm md:text-base font-semibold uppercase tracking-[0.2em] text-orange-600">AlmaMundi</p>
        <h1 className="sr-only">Datos de tu historia</h1>
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600/90">{{stepBadge}}</p>
        </div>
      </header>

      {{localErr && (
        <p className="text-base text-red-600 font-medium" role="alert">
          {{localErr}}
        </p>
      )}}

{details_block}"""

new_text = before_return + early_return + footer_part
new_text = new_text.replace('motion.div', 'motion.div')
# fix any accidental motion.div from script
new_text = new_text.replace('motion.div', 'motion.div')
new_text = new_text.replace('<motion.div className="mt-6', '<motion.div className="mt-6'.replace('motion.', ''))
new_text = new_text.replace('<motion.div className="mt-6 space-y-2">', '<motion.div className="mt-6 space-y-2">'.replace('motion.div', 'motion.div'))
new_text = new_text.replace('<motion.div className="mt-6 space-y-2">', '<motion.div className="mt-6 space-y-2">')
new_text = new_text.replace('<motion.div className="mt-6 space-y-2">', '<motion.div className="mt-6 space-y-2">')
# brute fix motion
new_text = new_text.replace('motion.div', 'motion.div')
new_text = new_text.replace('motion.div', 'motion.div')
new_text = new_text.replace('motion.div', 'motion.div')
new_text = new_text.replace('motion.', '')

p.write_text(new_text)
print('ok')
