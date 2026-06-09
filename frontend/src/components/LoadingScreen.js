import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isDone, setIsDone] = useState(false);

  const diagnosticLogs = [
    'INITIATING HIMALIX SYSTEM CORE...',
    'CONNECTING TO MYSQL DATABASES...',
    'ESTABLISHING ENCRYPTED JWT PIPELINES...',
    'COMPILING GRAPHICS AND DYNAMIC RENDERS...',
    'MOUNTING PCB CONTROLLERS AND STATIONS...',
    'SPAWNING THREE-DIMENSIONAL SPACE BLOCKS...',
    'CALIBRATING HARDWARE INTERFACES...',
    'ALL MODULES SECURED AND READY.',
  ];

  useEffect(() => {
    // Add logs dynamically as counter increments
    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < diagnosticLogs.length) {
        setLogs((prev) => [...prev, diagnosticLogs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 450);

    // Dynamic progress simulation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 4) + 1;
        if (next >= 100) {
          clearInterval(progressInterval);
          setIsDone(true);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 1000); // Wait for animations to resolve
          return 100;
        }
        return next;
      });
    }, 40);

    return () => {
      clearInterval(progressInterval);
      clearInterval(logInterval);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          className="loader-overlay"
          initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          exit={{ 
            clipPath: 'inset(100% 0% 0% 0%)',
            transition: { duration: 1.1, ease: [0.85, 0, 0.15, 1] } 
          }}
        >
          <div className="loader-container">
            <div className="loader-info">
              <span className="loader-brand">HIMALIX LABS</span>
              <span className="loader-version">SYSTEM BOOT v3.9.5</span>
            </div>

            <div className="loader-main">
              <div className="loader-counter-wrapper">
                <motion.span 
                  className="loader-counter"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {String(progress).padStart(3, '0')}
                </motion.span>
                <span className="loader-percent">%</span>
              </div>

              <div className="loader-bar-bg">
                <motion.div 
                  className="loader-bar-fill" 
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="loader-logs">
              {logs.slice(-4).map((log, index) => (
                <motion.div 
                  key={log} 
                  className="loader-log-item"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: index === logs.slice(-4).length - 1 ? 1 : 0.4, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="loader-log-prefix">&gt;&nbsp;</span>
                  {log}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
