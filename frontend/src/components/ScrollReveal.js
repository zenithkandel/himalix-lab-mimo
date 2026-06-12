import React, { useEffect, useRef } from 'react';

/**
 * ScrollReveal — wraps children and applies a CSS-based scroll reveal animation
 * using the Intersection Observer API. No external library needed.
 *
 * Props:
 *   delay   {number}  — CSS transition delay in ms (default: 0)
 *   from    {string}  — 'bottom' | 'left' | 'right' (default: 'bottom')
 *   distance {string} — CSS translate distance (default: '24px')
 */
export default function ScrollReveal({
  children,
  delay = 0,
  from = 'bottom',
  distance = '24px',
  style = {},
  className = '',
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const transforms = {
      bottom: `translateY(${distance})`,
      left:   `translateX(-${distance})`,
      right:  `translateX(${distance})`,
    };

    el.style.opacity    = '0';
    el.style.transform  = transforms[from] || transforms.bottom;
    el.style.transition = `opacity 600ms ease ${delay}ms, transform 600ms ease ${delay}ms`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity   = '1';
          el.style.transform = 'none';
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, from, distance]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
