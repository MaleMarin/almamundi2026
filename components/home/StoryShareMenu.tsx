'use client';

import { Download, Mail, X } from 'lucide-react';
import {
  buildStoryShareChannelUrls,
  copyTextToClipboard,
} from '@/lib/huella/share-story-channels';

export type StoryShareMenuLabels = {
  title: string;
  whatsapp: string;
  facebook: string;
  x: string;
  linkedin: string;
  email: string;
  copyLink: string;
  download: string;
  close: string;
};

type StoryShareMenuProps = {
  shareUrl: string;
  shareText: string;
  labels: StoryShareMenuLabels;
  showDownload: boolean;
  onCopied: () => void;
  onCopyFailed: () => void;
  onDownload: () => void;
  onClose: () => void;
};

export function StoryShareMenu({
  shareUrl,
  shareText,
  labels,
  showDownload,
  onCopied,
  onCopyFailed,
  onDownload,
  onClose,
}: StoryShareMenuProps) {
  const channels = buildStoryShareChannelUrls(shareUrl, shareText);

  const copyLink = async () => {
    const ok = await copyTextToClipboard(shareUrl);
    if (ok) onCopied();
    else onCopyFailed();
  };

  const itemClass =
    'inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D4D4C4] bg-white px-4 py-2.5 text-sm font-medium text-[#141D26] transition hover:border-[#ea580c] hover:text-[#c2410c]';

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
          <h4 id="story-share-menu-title" className="text-base font-semibold text-[#141D26]">
            {labels.title}
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#6B6B60] hover:text-[#FF4A1C]"
            aria-label={labels.close}
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <a className={itemClass} href={channels.whatsapp} target="_blank" rel="noreferrer">
            {labels.whatsapp}
          </a>
          <a className={itemClass} href={channels.facebook} target="_blank" rel="noreferrer">
            {labels.facebook}
          </a>
          <a className={itemClass} href={channels.x} target="_blank" rel="noreferrer">
            {labels.x}
          </a>
          <a className={itemClass} href={channels.linkedin} target="_blank" rel="noreferrer">
            {labels.linkedin}
          </a>
          <a className={itemClass} href={channels.email}>
            <Mail size={15} className="mr-2" aria-hidden />
            {labels.email}
          </a>
          <button type="button" className={itemClass} onClick={() => void copyLink()}>
            {labels.copyLink}
          </button>
          {showDownload ? (
            <button
              type="button"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#FF4A1C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#D13D17]"
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
