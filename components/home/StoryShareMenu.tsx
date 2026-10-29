'use client';

import { Download, Mail, X } from 'lucide-react';
import { downloadPngBlob } from '@/lib/huella/share-resonance-png';
import {
  canonicalStoryShareUrl,
  buildStoryShareChannelUrls } from '@/lib/huella/share-story-channels';

/** writeText en el mismo clic, sin await previos. Si no queda copiado, textarea oculto. */
function copyTextInClick(text: string, onSettled: (ok: boolean) => void): void {
  let pending: Promise<void> | null = null;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      pending = navigator.clipboard.writeText(text);
    }
  } catch (error) {
    console.error('[StoryShareMenu] clipboard.writeText', error);
    pending = null;
  }
  const synced = copyWithHiddenTextarea(text);
  if (synced) {
    if (pending) void pending.catch(() => {});
    onSettled(true);
    return;
  }
  if (!pending) {
    onSettled(false);
    return;
  }
  pending.then(() => onSettled(true)).catch((error: unknown) => {
    console.error('[StoryShareMenu] clipboard.writeText rejected', error);
    onSettled(false);
  });
}

function copyWithHiddenTextarea(text: string): boolean {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.setAttribute('aria-hidden', 'true');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (error) {
    console.error('[StoryShareMenu] execCommand copy', error);
    return false;
  }
}

export type StoryShareMenuLabels = {
  title: string;
  facebook: string;
  x: string;
  linkedin: string;
  instagram: string;
  tiktok: string;
  email: string;
  copyLink: string;
  download: string;
  close: string;
};

type StoryShareMenuProps = {
  shareUrl: string;
  shareTextShort: string;
  shareTextLong: string;
  emailSubject: string;
  labels: StoryShareMenuLabels;
  showDownload: boolean;
  /** Celular que acepta archivos en la hoja del sistema. */
  showImageApps: boolean;
  imageFile: File | null;
  shareTitle: string;
  onCopied: () => void;
  onTextCopied: () => void;
  onAppHandoff: (app: 'Instagram' | 'TikTok') => void;
  onCopyFailed: (text: string) => void;
  onDownload: () => void;
  onEmail: () => void;
  onClose: () => void;
};

export function StoryShareMenu({
  shareUrl,
  shareTextShort,
  shareTextLong,
  emailSubject,
  labels,
  showDownload,
  showImageApps,
  imageFile,
  shareTitle,
  onCopied,
  onTextCopied,
  onAppHandoff,
  onCopyFailed,
  onDownload,
  onEmail,
  onClose }: StoryShareMenuProps) {
  const channels = buildStoryShareChannelUrls(shareUrl, {
    short: shareTextShort,
    long: shareTextLong,
    emailSubject });

  const copyLink = () => {
    const link = canonicalStoryShareUrl(shareUrl);
    copyTextInClick(link, (ok) => {
      if (ok) onCopied();
      else onCopyFailed(link);
    });
  };

  const shareImage = (app: 'Instagram' | 'TikTok') => {
    const text = shareTextLong;
    const native = Boolean(
      showImageApps && imageFile && typeof navigator !== 'undefined' && typeof navigator.share === 'function'
    );
    copyTextInClick(text, (ok) => {
      if (!ok) onCopyFailed(text);
      else if (native) onTextCopied();
      else if (imageFile) onAppHandoff(app);
      else onTextCopied();
    });
    if (native && imageFile) {
      try {
        const pendingShare = navigator.share({
          files: [imageFile],
          title: shareTitle,
          text });
        void pendingShare.catch((error: unknown) => {
          const name = error instanceof Error ? error.name : '';
          if (name === 'AbortError') return;
          console.error('[StoryShareMenu] navigator.share', error);
          downloadPngBlob(imageFile, imageFile.name);
        });
      } catch (error) {
        console.error('[StoryShareMenu] navigator.share', error);
        downloadPngBlob(imageFile, imageFile.name);
      }
      return;
    }
    if (imageFile) downloadPngBlob(imageFile, imageFile.name);
  };

  const itemClass =
    'inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D4D4C4] bg-white px-4 py-2.5 text-[length:var(--fs-pequeno)] font-medium transition hover:border-[var(--almamundi-orange)]';
  const buttonClass = `${itemClass.replace('font-medium', 'font-semibold')} text-[var(--almamundi-orange)] hover:text-[var(--almamundi-orange)]`;

  return (
    <div
      className="fixed inset-0 z-[240] flex items-end justify-center bg-[rgba(15,23,42,0.45)] p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-share-menu-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[#F7F4EE] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h4 id="story-share-menu-title" className="text-[length:var(--fs-pequeno)] font-semibold text-[#141D26]">
            {labels.title}
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#6B6B60] hover:text-[var(--almamundi-orange)]"
            aria-label={labels.close}
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <a className={itemClass} href={channels.facebook} target="_blank" rel="noreferrer">
            {labels.facebook}
          </a>
          <a className={itemClass} href={channels.x} target="_blank" rel="noreferrer">
            {labels.x}
          </a>
          <a className={itemClass} href={channels.linkedin} target="_blank" rel="noreferrer">
            {labels.linkedin}
          </a>
          <button type="button" className={buttonClass} onClick={() => shareImage('Instagram')}>
            {labels.instagram}
          </button>
          <button type="button" className={buttonClass} onClick={() => shareImage('TikTok')}>
            {labels.tiktok}
          </button>
          <a
            className={itemClass}
            href={channels.email}
            onClick={() => {
              copyTextInClick(shareTextLong, (ok) => {
                if (ok) onEmail();
                else onCopyFailed(shareTextLong);
              });
            }}
          >
            <Mail size={15} className="mr-2" aria-hidden />
            {labels.email}
          </a>
          <button type="button" className={buttonClass} onClick={copyLink}>
            {labels.copyLink}
          </button>
          {showDownload ? (
            <button
              type="button"
              className="btn-am-principal inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 py-2.5 text-[length:var(--fs-pequeno)] font-semibold"
              onClick={onDownload}
            >
              <Download size={15} aria-hidden />
              {labels.download}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
