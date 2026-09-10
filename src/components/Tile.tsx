import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './Tile.module.css';

interface TileProps {
  children: ReactNode;
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Cascade sırası — skew-slide girişinin stagger'ı. */
  index?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
  'aria-label'?: string;
}

/**
 * Bento kartı (pist / pilot ızgarası). Keskin köşe, hairline kenar, gölgesiz;
 * girişte kademeli skew-slide (eski client'ın "tatlı" cascade'i, sert sisteme
 * uyarlandı). prefers-reduced-motion kapatır.
 */
export function Tile({
  children,
  to,
  onClick,
  disabled,
  index = 0,
  className,
  style,
  title,
  'aria-label': ariaLabel,
}: TileProps) {
  const cls = `${styles.tile} ${disabled ? styles.disabled : ''} ${className ?? ''}`;
  const mergedStyle = { '--i': index, ...style } as CSSProperties;

  if (to && !disabled) {
    return (
      <Link className={cls} style={mergedStyle} to={to} title={title} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  if (onClick && !disabled) {
    return (
      <button
        type="button"
        className={cls}
        style={mergedStyle}
        onClick={onClick}
        title={title}
        aria-label={ariaLabel}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={cls} style={mergedStyle} title={title} aria-label={ariaLabel}>
      {children}
    </div>
  );
}
