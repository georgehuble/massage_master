import React from 'react';
import { motion } from 'framer-motion';

export default function BookingButton({ disabled, onClick, children = "Записаться", loading = false }) {
  return (
    <motion.button
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={`
        w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg
        ${disabled || loading 
          ? 'bg-gray-400 cursor-not-allowed opacity-60' 
          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 active:scale-95'
        }
      `}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
          <span>Записываю...</span>
        </div>
      ) : (
        <span className="flex items-center justify-center space-x-2">
          <span>✨</span>
          <span>{children}</span>
        </span>
      )}
    </motion.button>
  );
}
  