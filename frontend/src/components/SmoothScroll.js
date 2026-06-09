import React, { useEffect, useRef } from 'react';

const SmoothScroll = ({ children }) => {
  const scrollContainerRef = useRef(null);
  const bodySpacerRef = useRef(null);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    // Create spacer if it doesn't exist
    let spacer = document.getElementById('smooth-scroll-spacer');
    if (!spacer) {
      spacer = document.createElement('div');
      spacer.id = 'smooth-scroll-spacer';
      document.body.appendChild(spacer);
    }
    bodySpacerRef.current = spacer;

    // Apply fixed styling to scroll wrapper
    scrollContainer.style.position = 'fixed';
    scrollContainer.style.top = '0';
    scrollContainer.style.left = '0';
    scrollContainer.style.width = '100%';
    scrollContainer.style.overflow = 'hidden';
    scrollContainer.style.willChange = 'transform';

    let currentY = window.scrollY;
    let targetY = window.scrollY;
    const ease = 0.08; // Inertia factor (lower = smoother/heavier)
    let animationFrameId;

    const updateHeight = () => {
      if (scrollContainer && bodySpacerRef.current) {
        const height = scrollContainer.getBoundingClientRect().height;
        bodySpacerRef.current.style.height = `${height}px`;
      }
    };

    // Listen to resize changes to dynamically adjust scrollbar height
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });
    resizeObserver.observe(scrollContainer);

    const handleScroll = () => {
      targetY = window.scrollY;
    };

    const smoothScrollLoop = () => {
      // Lerp logic
      currentY += (targetY - currentY) * ease;
      
      // Round to 2 decimal places to avoid rendering glitches
      const roundedY = Math.round(currentY * 100) / 100;
      scrollContainer.style.transform = `translate3d(0, -${roundedY}px, 0)`;

      animationFrameId = requestAnimationFrame(smoothScrollLoop);
    };

    window.addEventListener('scroll', handleScroll);
    updateHeight();
    smoothScrollLoop();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (bodySpacerRef.current && bodySpacerRef.current.parentNode) {
        bodySpacerRef.current.parentNode.removeChild(bodySpacerRef.current);
      }
      if (scrollContainer) {
        scrollContainer.style.position = '';
        scrollContainer.style.top = '';
        scrollContainer.style.left = '';
        scrollContainer.style.width = '';
        scrollContainer.style.overflow = '';
        scrollContainer.style.transform = '';
      }
    };
  }, []);

  return (
    <div ref={scrollContainerRef}>
      {children}
    </div>
  );
};

export default SmoothScroll;
