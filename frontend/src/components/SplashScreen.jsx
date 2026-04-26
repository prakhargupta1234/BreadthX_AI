import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState(0); // 0=logo, 1=text, 2=exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 2400);
    const t3 = setTimeout(() => onComplete(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase < 2 && (
        <motion.div
          className="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Animated background rings */}
          <div className="splash-rings">
            <motion.div className="splash-ring splash-ring-1"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.8, 2.2], opacity: [0, 0.15, 0] }}
              transition={{ duration: 2.5, ease: 'easeOut' }} />
            <motion.div className="splash-ring splash-ring-2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.4, 1.8], opacity: [0, 0.12, 0] }}
              transition={{ duration: 2.5, delay: 0.3, ease: 'easeOut' }} />
            <motion.div className="splash-ring splash-ring-3"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1, 1.4], opacity: [0, 0.1, 0] }}
              transition={{ duration: 2.5, delay: 0.6, ease: 'easeOut' }} />
          </div>

          {/* Floating particles */}
          <div className="splash-particles">
            {[...Array(6)].map((_, i) => (
              <motion.div key={i} className="splash-particle"
                style={{
                  left: `${15 + i * 14}%`,
                  top: `${20 + (i % 3) * 25}%`,
                  width: 4 + (i % 3) * 2,
                  height: 4 + (i % 3) * 2,
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: [0, 0.6, 0], y: [20, -30, -60] }}
                transition={{ duration: 2.5, delay: 0.2 + i * 0.15, ease: 'easeOut' }}
              />
            ))}
          </div>

          {/* Logo */}
          <motion.div className="splash-logo-wrap"
            initial={{ scale: 0.3, opacity: 0, rotateY: -90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <div className="splash-logo-glow" />
            <div className="splash-logo-icon">
              <Activity size={56} color="#fff" strokeWidth={2.5} />
            </div>
          </motion.div>

          {/* Text */}
          <motion.div className="splash-text"
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <h1 className="splash-title">
              <span className="splash-title-gradient">BreatheX</span> AI
            </h1>
            <p className="splash-subtitle">Intelligent Respiratory Disease Classification</p>

            {/* Loading bar */}
            <div className="splash-loader-track">
              <motion.div className="splash-loader-fill"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
