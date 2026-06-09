import { useRef, useState, useEffect } from 'react';

export const useScrollAnimation = (options = {}) => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const { threshold = 0.1, triggerOnce = true } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) observer.unobserve(element);
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, triggerOnce]);

  return { ref, isInView };
};
