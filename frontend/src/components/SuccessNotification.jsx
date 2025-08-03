import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const SuccessNotification = ({ show, message, onClose, duration = 2000 }) => {
  // Не даём повторно вызывать onClose, если show уже false
  const closedRef = React.useRef(false);

  React.useEffect(() => {
    if (show && duration > 0) {
      closedRef.current = false;
      const timer = setTimeout(() => {
        if (!closedRef.current) {
          closedRef.current = true;
          onClose();
        }
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const handleClose = () => {
    if (!closedRef.current) {
      closedRef.current = true;
      onClose();
    }
  };

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.95 }}
          transition={{
            type: "spring",
            duration: 0.5,
            bounce: 0.2
          }}
          className="fixed top-4 left-0 right-0 z-[9999] flex justify-center pointer-events-none px-4"
          style={{ transform: "translateX(-50%)" }}
        >
          <div className="pointer-events-auto bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-2xl shadow-2xl border border-green-400 flex items-center space-x-3 w-full max-w-xs sm:max-w-md min-w-[180px] break-words">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xl">✅</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm sm:text-base break-words">{message}</p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all flex-shrink-0"
              aria-label="Закрыть уведомление"
              tabIndex={0}
            >
              <span className="text-white text-lg">×</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SuccessNotification; 