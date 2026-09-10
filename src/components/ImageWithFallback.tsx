import { useState, type ImgHTMLAttributes } from 'react';

/**
 * Gömülü SVG placeholder (ölü bir domaine bağlı DEĞİL — sonsuz onerror döngüsünü kırar).
 * Kaynak: telemetria-client/.../script.js → window.TLM_IMG_PLACEHOLDER
 */
export const EMBEDDED_PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90">' +
      '<rect width="160" height="90" fill="#1A1D24"/>' +
      '<path d="M18 62 Q42 18 82 44 T142 38" fill="none" stroke="#E10600" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="142" cy="38" r="4.5" fill="#E10600"/>' +
      '</svg>',
  );

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> {
  src: string | null | undefined;
  alt: string;
  /** Birincil kaynak yüklenemezse denenecek ara URL. Bittiğinde gömülü SVG'ye düşer. */
  fallbackSrc?: string;
}

type Stage = 'primary' | 'fallback' | 'embedded';

/**
 * Tek yönlü, guard'lı görsel: her aşama en fazla bir kez denenir; son aşamada
 * hata gelirse olduğu gibi bırakılır. Aynı tipte URL'i tekrar deneyip 404 →
 * onerror → 404 döngüsüne girmez.
 */
export function ImageWithFallback({ src, alt, fallbackSrc, ...rest }: Props) {
  const [stage, setStage] = useState<Stage>('primary');

  const resolvedSrc =
    stage === 'primary'
      ? (src ?? fallbackSrc ?? EMBEDDED_PLACEHOLDER)
      : stage === 'fallback'
        ? (fallbackSrc ?? EMBEDDED_PLACEHOLDER)
        : EMBEDDED_PLACEHOLDER;

  return (
    <img
      {...rest}
      src={resolvedSrc}
      alt={alt}
      onError={() => {
        setStage((current) => {
          if (current === 'primary') return fallbackSrc ? 'fallback' : 'embedded';
          if (current === 'fallback') return 'embedded';
          return current; // embedded: bırak, döngü yok
        });
      }}
    />
  );
}
