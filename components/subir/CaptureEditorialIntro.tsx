'use client';

import amStyles from '@/components/subir/am-upload-modal.module.css';

type Props = {
  title: string;
  subtitle: string;
  limit?: string;
  titlePreLine?: boolean;
};

export function CaptureEditorialIntro({ title, subtitle, limit, titlePreLine = false }: Props) {
  return (
    <div className="mb-6">
      <span className={amStyles.amModalBrand}>ALMAMUNDI</span>
      <h2
        className={amStyles.amModalTitle}
        style={{ whiteSpace: titlePreLine ? 'pre-line' : 'normal', marginTop: 24 }}
      >
        {title}
      </h2>
      <p className={amStyles.amModalSubtitle}>{subtitle}</p>
      {limit ? <p className={amStyles.amModalLimit}>{limit}</p> : null}
    </div>
  );
}
