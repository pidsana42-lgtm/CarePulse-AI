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
        }, 350);
        return () => clearTimeout(enterTimer);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <div
      style={{
        transition: 'opacity 200ms ease, transform 200ms ease',
        opacity: transitionStage === 'leave' ? 0 : 1,
        transform: transitionStage === 'leave'
          ? 'translateY(6px)'
          : transitionStage === 'enter'
          ? 'translateY(-4px)'
          : 'translateY(0)',
      }}
    >
      {displayChildren}
    </div>
  );
}
