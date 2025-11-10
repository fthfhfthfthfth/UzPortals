
import { useEffect, useRef } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface AnimationPlayerProps {
  animationPath: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  onComplete?: () => void;
}

export function AnimationPlayer({
  animationPath,
  className = "w-32 h-32",
  loop = true,
  autoplay = true,
  onComplete
}: AnimationPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    animationRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop,
      autoplay,
      path: animationPath
    });

    if (onComplete) {
      animationRef.current.addEventListener('complete', onComplete);
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
      }
    };
  }, [animationPath, loop, autoplay, onComplete]);

  return <div ref={containerRef} className={className} />;
}
