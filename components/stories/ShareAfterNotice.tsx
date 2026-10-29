'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { StoryShareMenu } from '@/components/home/StoryShareMenu';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { interpolate } from '@/lib/i18n/locale';
import { preguntaInviteShareText, preguntaShareText } from '@/lib/i18n/pregunta-messages';
import { isShortCode } from '@/lib/short-code';
import {
  publishedAnswerShortUrl,
  publishedQuestionShareUrl,
  publishedStoryEmailSubject,
  publishedStoryShareText,
  publishedStoryShareUrl,
  publishedStoryShortUrl,
  publishedStorySocialText,
  type PublishedStoryFormat } from '@/lib/share/published-share';

const NOTICE = {
  es: {
    title: 'Compartir con cuidado',
    body: 'Alguien decidió contar esta historia en AlmaMundi. Si la compartes, que viaje con el mismo respeto con que fue contada.',
    share: 'Compartir',
    back: 'Volver',
  },
  pt: {
    title: 'Compartilhar com cuidado',
    body: 'Alguém decidiu contar esta história no AlmaMundi. Se você a compartilhar, que ela viaje com o mesmo respeito com que foi contada.',
    share: 'Compartilhar',
    back: 'Voltar',
  },
  en: {
    title: 'Share with care',
    body: 'Someone chose to tell this story on AlmaMundi. If you share it, let it travel with the same respect it was told with.',
    share: 'Share',
    back: 'Go back',
  },
} as const;

type ShareAfterNoticeProps = {
  open: boolean;
  onClose: () => void;
} & (
  | { kind: 'story'; storyId: string; title: string; city: string; format: PublishedStoryFormat }
  | { kind: 'question'; questionId: string; question: string; afterAnswer?: boolean }
  | { kind: 'answer'; answerId: string; questionId: string; shortCode?: string; question: string }
);

type SharePacket = { url: string; text: string; social: string };

function sharePacket(props: ShareAfterNoticeProps, locale: 'es' | 'pt' | 'en', url: string): SharePacket {
  if (props.kind === 'story') {
    return {
      url,
      text: publishedStoryShareText(locale, props.format, props.title, props.city, url),
      social: publishedStorySocialText(locale, props.title, props.city, url),
    };
  }
  const text =
    props.kind === 'question' && props.afterAnswer
      ? preguntaShareText(locale, props.question, url)
      : preguntaInviteShareText(locale, props.question, url);
  return { url, text, social: text };
}

export function ShareAfterNotice(props: ShareAfterNoticeProps) {
  const { locale, t } = useHomeLocale();
  const { open, onClose } = props;
  const [step, setStep] = useState<'notice' | 'menu'>('notice');
  const [toast, setToast] = useState<string | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  const [packet, setPacket] = useState<SharePacket | null>(null);
  const [wantMenu, setWantMenu] = useState(false);
  const shareKey =
    props.kind === 'story'
      ? `story:${props.storyId}`
      : props.kind === 'answer'
        ? `answer:${props.answerId}:${props.questionId}:${props.shortCode ?? ''}`
        : `question:${props.questionId}:${props.afterAnswer ? '1' : '0'}`;

  useEffect(() => {
    if (!open) return;
    setStep('notice');
    setToast(null);
    setFallback(null);
    setWantMenu(false);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setPacket(null);
      return;
    }
    if (props.kind === 'question') {
      setPacket(sharePacket(props, locale, publishedQuestionShareUrl(props.questionId)));
      return;
    }
    if (props.kind === 'answer' && isShortCode(props.shortCode)) {
      setPacket(sharePacket(props, locale, publishedAnswerShortUrl(props.shortCode)));
      return;
    }
    const storyId = props.kind === 'story' ? props.storyId : '';
    const answerId = props.kind === 'answer' ? props.answerId : '';
    const questionId = props.kind === 'answer' ? props.questionId : '';
    const fallback =
      props.kind === 'story' ? publishedStoryShareUrl(storyId) : publishedQuestionShareUrl(questionId);
    setPacket(sharePacket(props, locale, fallback));
    let cancel = false;
    const load = async () => {
      try {
        if (answerId) {
          const res = await fetch(`/api/respuestas/public/${encodeURIComponent(answerId)}`, {
            cache: 'no-store',
          });
          const data = (res.ok ? await res.json() : null) as { item?: { shortCode?: string } } | null;
          const code = data?.item?.shortCode;
          if (cancel) return;
          const url = isShortCode(code) ? publishedAnswerShortUrl(code) : publishedQuestionShareUrl(questionId);
          setPacket(sharePacket(props, locale, url));
          return;
        }
        const res = await fetch(`/api/stories/${encodeURIComponent(storyId)}`, { cache: 'no-store' });
        const data = (res.ok ? await res.json() : null) as { story?: { shortCode?: string } } | null;
        const code = data?.story?.shortCode;
        if (cancel) return;
        const url = isShortCode(code) ? publishedStoryShortUrl(code) : publishedStoryShareUrl(storyId);
        setPacket(sharePacket(props, locale, url));
      } catch {
        if (!cancel) setPacket(sharePacket(props, locale, fallback));
      }
    };
    void load();
    return () => {
      cancel = true;
    };
  }, [open, shareKey, locale]);

  useEffect(() => {
    if (wantMenu && packet?.url) setStep('menu');
  }, [wantMenu, packet]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 7000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (typeof document === 'undefined') return null;
  if (!open) {
    return fallback || toast
      ? createPortal(
          <ShareStatus toast={toast} fallback={fallback} failedLabel={t.modalShareCopyFailed} />,
          document.body
        )
      : null;
  }

  const emailSubject =
    props.kind === 'story'
      ? publishedStoryEmailSubject(locale)
      : props.question.slice(0, 120);
  const shareTitle = props.kind === 'story' ? props.title : props.question;
  const notice = NOTICE[locale];

  return createPortal(
    <>
      {step !== 'menu' || !packet ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={onClose}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-notice-title"
            className="relative max-h-[min(92vh,640px)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/20 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-md"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
            <div className="pr-8">
              <h2 id="share-notice-title" className="text-[length:var(--fs-texto)] font-semibold leading-snug">
                {notice.title}
              </h2>
              <p className="mt-4 text-[length:var(--fs-pequeno)] leading-relaxed text-white/90">{notice.body}</p>
              <div className="mt-6 flex flex-nowrap items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (packet?.url) setStep('menu');
                    else setWantMenu(true);
                  }}
                  className="btn-am-principal inline-flex min-h-11 flex-1 items-center justify-center px-4 py-2.5 text-center text-[length:var(--fs-pequeno)] font-medium leading-tight"
                >
                  {notice.share}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-am-secundario inline-flex min-h-11 flex-1 items-center justify-center px-4 py-2.5 text-center text-[length:var(--fs-pequeno)] font-medium leading-tight"
                >
                  {notice.back}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <StoryShareMenu
          shareUrl={packet.url}
          shareTextShort={packet.text}
          shareTextLong={packet.text}
          shareTextSocial={packet.social}
          emailSubject={emailSubject}
          keepShareUrl
          labels={{
            title: t.modalShareMenuTitle,
            facebook: t.modalShareFacebook,
            x: t.modalShareX,
            linkedin: t.modalShareLinkedIn,
            instagram: t.modalShareInstagram,
            tiktok: t.modalShareTikTok,
            email: t.modalShareEmail,
            copyLink: t.modalCopyLink,
            download: t.modalDownloadImprint,
            close: t.modalClose }}
          showDownload={false}
          showImageApps={false}
          imageFile={null}
          shareTitle={shareTitle}
          onCopied={() => {
            setFallback(null);
            setToast(t.modalShareLinkCopied);
            onClose();
          }}
          onTextCopied={() => {
            setFallback(null);
            setToast(t.modalShareTextCopied);
            onClose();
          }}
          onAppHandoff={(app) => {
            setFallback(null);
            setToast(interpolate(t.modalShareAppHandoff, { app }));
            onClose();
          }}
          onCopyFailed={(value) => {
            setToast(t.modalShareCopyFailed);
            setFallback(value);
            onClose();
          }}
          onDownload={() => undefined}
          onEmail={() => {
            setFallback(null);
            setToast(t.modalShareEmailCopied);
            onClose();
          }}
          onClose={onClose}
        />
      )}
      <ShareStatus toast={toast} fallback={fallback} failedLabel={t.modalShareCopyFailed} />
    </>,
    document.body
  );
}

function ShareStatus({
  toast,
  fallback,
  failedLabel }: {
  toast: string | null;
  fallback: string | null;
  failedLabel: string;
}) {
  if (!toast && !fallback) return null;
  return (
    <>
      {toast ? (
        <div
          className="pointer-events-none fixed bottom-8 left-1/2 z-[260] max-w-[min(92vw,420px)] -translate-x-1/2 rounded-full border border-white/25 bg-black/75 px-5 py-3 text-center text-[length:var(--fs-pequeno)] text-white shadow-xl backdrop-blur-md"
          role="status"
        >
          {toast}
        </div>
      ) : null}
      {fallback ? (
        <label className="fixed bottom-24 left-1/2 z-[260] w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl bg-white p-3 text-[length:var(--fs-etiqueta)] text-[#141D26] shadow-xl">
          {failedLabel}
          <textarea
            readOnly
            value={fallback}
            className="mt-1 w-full resize-y rounded-xl border border-[#D4D4C4] px-3 py-2 text-[length:var(--fs-pequeno)]"
            rows={4}
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
      ) : null}
    </>
  );
}
