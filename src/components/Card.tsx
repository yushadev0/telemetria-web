import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import styles from './Card.module.css';

interface CardProps {
  children: ReactNode;
  /** Verilirse satır bir <Link>'e dönüşür. */
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Stagger sırası — giriş animasyonu için. */
  index?: number;
  /** Sağdaki chevron'u gizle. */
  hideChevron?: boolean;
  className?: string;
  style?: CSSProperties;
  title?: string;
  'aria-label'?: string;
}

/**
 * Timing-monitor satırı: tam genişlik, hairline alt çizgi, hover'da sinyal
 * kenarı + zemin tonu. Cascade girişi CSS'te; prefers-reduced-motion kapatır.
 */
export function Card({
  children,
  to,
  onClick,
  disabled,
  index = 0,
  hideChevron,
  className,
  style,
  title,
  'aria-label': ariaLabel,
}: CardProps) {
  const cls = `${styles.row} ${disabled ? styles.disabled : ''} ${className ?? ''}`;
  const mergedStyle = { '--i': index, ...style } as CSSProperties;

  const inner = (
    <>
      <div className={styles.content}>{children}</div>
      {!hideChevron && <ChevronRight className={styles.chevron} size={16} aria-hidden />}
    </>
  );

  if (to && !disabled) {
    return (
      <Link className={cls} style={mergedStyle} to={to} title={title} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        className={cls}
        style={mergedStyle}
        onClick={onClick}
        disabled={disabled}
        title={title}
        aria-label={ariaLabel}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={cls} style={mergedStyle} title={title} aria-label={ariaLabel}>
      {inner}
    </div>
  );
}
