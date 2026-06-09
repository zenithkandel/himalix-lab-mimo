import React, { useState, useEffect, useRef } from 'react';

const AnimatedCounter = ({ end, suffix = '', duration = 2 }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;

    const target = parseInt(end, 10);
    const increment = target / (duration * 60);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [hasAnimated, end, duration]);

  const formatNumber = (num) => {
    return num.toLocaleString('en-US');
  };

  return (
    <span className="animated-counter" ref={ref} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {formatNumber(count)}{suffix}
    </span>
  );
};

export default AnimatedCounter;
