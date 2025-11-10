
import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsComplete(true);
      setTimeout(onComplete, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[#2d2d2d] transition-opacity duration-300 ${isComplete ? 'opacity-0' : 'opacity-100'}`}>
      <div className="flex flex-col items-center space-y-8">
        <div className="w-64 h-64 flex items-center justify-center">
          <img 
            src="/loadingscreen.gif" 
            alt="Loading..." 
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-wider gradient-text animate-fade-in">
          UzPortals
        </h1>
      </div>
    </div>
  );
}
