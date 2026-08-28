import { useEffect, useState } from 'react';

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) return;
      const current = (window.scrollY / totalHeight) * 100;
      setProgress(Math.min(Math.max(current, 0), 100));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className="scroll-progress-bar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: '3px',
        background: 'linear-gradient(90deg, #ff4d23, #ff8a65, #ff4d23)',
        boxShadow: '0 0 10px rgba(255, 77, 35, 0.6), 0 0 20px rgba(255, 77, 35, 0.3)',
        zIndex: 9999,
        transition: 'width 0.1s linear',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
