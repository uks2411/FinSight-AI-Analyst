import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity } from 'lucide-react';

interface IntroSplashProps {
  onComplete: () => void;
}

export const IntroSplash: React.FC<IntroSplashProps> = ({ onComplete }) => {
  const [percent, setPercent] = useState(0);
  const [isWashingAway, setIsWashingAway] = useState(false);
  const [isRendered, setIsRendered] = useState(true);

  useEffect(() => {
    // Smooth progress simulation for water filling
    const start = Date.now();
    const duration = 2500; // 2.5 seconds to fill water

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);
      setPercent(Math.round(currentProgress));

      if (elapsed >= duration) {
        clearInterval(interval);
        // Start washing away phase
        setIsWashingAway(true);
        
        // Wait for wash-away animation to complete (approx 800ms) before unmounting
        setTimeout(() => {
          setIsRendered(false);
          onComplete();
        }, 900);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [onComplete]);

  if (!isRendered) return null;

  // Svg wave height translates to vertical position from bottom (100 is empty, 0 is full)
  const waveY = 100 - percent;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#030303] flex items-center justify-center select-none font-sans">
      <style>{`
        @keyframes waveMove1 {
          0% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(-25%, 2px, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes waveMove2 {
          0% { transform: translate3d(-50%, 0, 0); }
          50% { transform: translate3d(-25%, -3px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes particleRise {
          0% { transform: translateY(10px) scale(0.6); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-40px) scale(0); opacity: 0; }
        }
        .animate-wave-1 {
          animation: waveMove1 6s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite;
        }
        .animate-wave-2 {
          animation: waveMove2 8s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite;
        }
      `}</style>

      {/* Background radial gradient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.12)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

      {/* Floating fine water bubbles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-brand-400/30"
            style={{
              left: `${15 + Math.random() * 70}%`,
              bottom: `${10 + Math.random() * 80}%`,
              width: `${2 + Math.random() * 6}px`,
              height: `${2 + Math.random() * 6}px`,
              animation: `particleRise ${1.5 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Central Interactive Water Sphere logo */}
      <div className="relative flex flex-col items-center justify-center z-10 text-center px-4">
        {/* Sphere Container */}
        <div className="relative w-36 h-36 md:w-44 md:h-44 mb-8 bg-[#090909] rounded-full p-1 border-2 border-dark-border/40 flex items-center justify-center shadow-[0_0_50px_rgba(20,184,166,0.05),0_0_1px_rgba(20,184,166,0.2)_inset]">
          {/* Subtle reflection overlay for water glass sphere effect */}
          <div className="absolute top-1 left-4 right-4 h-1/3 bg-gradient-to-b from-white/10 to-transparent rounded-t-full pointer-events-none z-30" />
          <div className="absolute inset-2 bg-gradient-to-tr from-brand-500/5 to-transparent rounded-full pointer-events-none z-10" />

          {/* Liquid Mask Container */}
          <div className="relative w-full h-full rounded-full overflow-hidden bg-black/60 z-20">
            {/* Wave SVGs */}
            <svg 
              viewBox="0 0 100 100" 
              preserveAspectRatio="none" 
              className="absolute inset-0 w-full h-full"
              style={{
                transform: `scaleY(1.02)`,
              }}
            >
              <defs>
                {/* Dual Waves Color Gradients */}
                <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.95" />
                  <stop offset="60%" stopColor="#0d9488" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#115e59" stopOpacity="0.98" />
                </linearGradient>
                <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#042f2e" stopOpacity="0.6" />
                </linearGradient>
              </defs>

              {/* Back Wave (slower, lighter teal) */}
              <g style={{ transform: `translateY(${waveY}px)`, transition: 'transform 0.1s linear' }}>
                <path 
                  d="M0,10 Q25,8 50,10 T100,10 T150,10 T200,10 L200,100 L0,100 Z" 
                  fill="url(#waveGrad2)" 
                  className="animate-wave-2"
                  style={{ width: '200%' }}
                />
              </g>

              {/* Front Wave (faster, deeper teal) */}
              <g style={{ transform: `translateY(${waveY}px)`, transition: 'transform 0.1s linear' }}>
                <path 
                  d="M0,10 Q25,12 50,10 T100,10 T150,10 T200,10 L200,100 L0,100 Z" 
                  fill="url(#waveGrad1)" 
                  className="animate-wave-1"
                  style={{ width: '200%' }}
                />
              </g>
            </svg>

            {/* Absolute Centered Logo Icon Inside Water (Highly visible negative space cut-out) */}
            <div className="absolute inset-0 flex items-center justify-center z-30">
              <div className="text-white mix-blend-difference flex flex-col items-center">
                <Activity size={32} className="text-white drop-shadow-[0_2px_8px_rgba(20,184,166,0.3)]" />
                <span className="text-[12px] font-mono tracking-[0.2em] font-bold mt-1.5 uppercase opacity-90">LAB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Text Loader */}
        <div className="space-y-2 relative">
          <h2 className="text-2xl font-display font-extrabold text-white tracking-[0.25em] relative uppercase">
            FINSIGHT
            <span className="absolute -inset-x-2 inset-y-0 bg-transparent blur-md text-brand-500/20 mix-blend-color-dodge select-none">FINSIGHT</span>
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-xs text-dark-muted font-mono">
            <span className="text-brand-400 font-bold">{percent}%</span>
            <span className="h-1 w-1 bg-dark-border rounded-full" />
            <span className="tracking-wider uppercase">VALUATION PORTFOLIO</span>
          </div>
        </div>
      </div>

      {/* Sweep fluid-wash transitions to reveal applet */}
      <AnimatePresence>
        {isWashingAway && (
          <>
            {/* The sweeping vertical wave that runs of the screen (wash away overlay) */}
            <motion.div
              initial={{ top: '100%' }}
              animate={{ top: '-120%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.95, ease: [0.77, 0, 0.175, 1] }}
              className="absolute left-0 right-0 h-[120%] bg-gradient-to-b from-teal-500 via-teal-400 to-[#030303] z-[99999] shadow-[0_-15px_100px_rgba(20,184,166,0.5)]"
              style={{
                borderRadius: '50% 50% 0 0 / 15% 15% 0 0',
              }}
            >
              {/* Secondary offset ripple wave inside the clean sweep */}
              <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-black to-transparent opacity-30 select-none" />
              <div className="absolute top-10 left-12 right-12 text-white/10 font-mono font-black text-6xl tracking-widest pointer-events-none select-none text-center">
                FINSIGHT SYSTEM REVEALED
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
