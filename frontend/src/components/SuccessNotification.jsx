import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SuccessNotification = ({ show, message, onClose, duration = 1000 }) => {
  React.useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            duration: 0.6,
            bounce: 0.3
          }}
          className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md"
        >
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-2xl shadow-2xl border border-green-400">
            <div className="flex items-center space-x-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center"
              >
                <span className="text-2xl">✅</span>
              </motion.div>
              <div className="flex-1">
                <p className="font-semibold text-lg">{message}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
              >
                <span className="text-white text-lg">×</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessNotification; 