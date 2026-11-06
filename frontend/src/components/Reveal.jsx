import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

/** Fades + lifts its children into view the first time they scroll on screen. */
export default function Reveal({ children, delay = 0, y = 28, sx, className, style }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window) || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); io.disconnect(); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      className={className}
      style={style}
      sx={{
        opacity: shown ? 1 : 0, transform: shown ? 'none' : `translateY(${y}px)`,
        transition: `opacity 0.8s ease ${delay}ms, transform 0.8s cubic-bezier(.22,.8,.24,1) ${delay}ms`, ...sx,
      }}
    >
      {children}
    </Box>
  );
}
