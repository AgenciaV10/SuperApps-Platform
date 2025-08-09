import styles from './styles.module.scss';
import React from 'react';

type BackgroundRaysProps = {
  variant?: 'subtle' | 'cta';
  opacityOverride?: number;
  particles?: number;
};

export default function BackgroundRays({ variant = 'subtle', opacityOverride, particles = 36 }: BackgroundRaysProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = containerRef.current;

    if (!el) {
      return undefined;
    }

    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      el.style.setProperty('--sa-pointer-x', `${x}%`);
      el.style.setProperty('--sa-pointer-y', `${Math.max(5, y - 15)}%`);
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const style = React.useMemo(() => {
    const s: React.CSSProperties = {};

    if (typeof opacityOverride === 'number') {
      (s as any)['--bolt-elements-rays-opacity'] = String(opacityOverride);
    }

    return s;
  }, [opacityOverride]);

  return (
    <div ref={containerRef} className={styles.rayContainer} data-variant={variant} style={style}>
      {/* CAMADAS: quente, frio, luz */}
      <div className={`${styles.layer} ${styles.layerHot}`} />
      <div className={`${styles.layer} ${styles.layerCool}`} />
      <div className={`${styles.layer} ${styles.layerSpot}`} />
      {/* Partículas */}
      <div className={styles.particles} aria-hidden>
        {Array.from({ length: particles }).map((_, i) => (
          <span key={i} className={styles.particle} style={{ ['--i' as any]: i }} />
        ))}
      </div>
    </div>
  );
}
