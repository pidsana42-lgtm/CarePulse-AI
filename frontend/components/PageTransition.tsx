'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'enter' | 'leave' | 'idle'>('idle');
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathnameRef.current) {
      setTransitionStage('leave');
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        prevPathnameRef.current = pathname;
        setTransitionStage('enter');
        const enterTimer = setTimeout(() => {
          setTransitionStage('idle');
        }, 300);
        return () => clearTimeout(enterTimer);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <div
      style={{
        transition: 'opacity 250ms cubic-bezier(0.16, 1, 0.3, 1), transform 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: transitionStage === 'leave' ? 0 : 1,
        transform: transitionStage === 'leave'
          ? 'translateY(8px) scale(0.995)'
          : transitionStage === 'enter'
          ? 'translateY(-4px) scale(1)'
          : 'translateY(0) scale(1)',
      }}
    >
      {displayChildren}
    </div>
  );
}
