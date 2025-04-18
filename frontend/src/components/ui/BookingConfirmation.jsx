import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BookingConfirmation = ({ bookings, onCancel, onRebook }) => {
  const nearest = bookings
    .filter(date => new Date(date) > new Date())
    .sort((a, b) => new Date(a) - new Date(b))[0];

  const formattedDate = new Date(nearest).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <AnimatePresence>
      <motion.div
        key="confirmation"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 text-center space-y-6"
      >
        <p className="text-lg font-medium">
          Вы успешно записались на <br />
          <span className="font-bold text-blue-600">{formattedDate}</span>
        </p>
        <div className="flex flex-col gap-4">
          <button
            onClick={onCancel}
            className="bg-red-500 text-white py-2 px-4 rounded-lg active:scale-95 transition-transform"
          >
            Отменить запись
          </button>
          <button
            onClick={onRebook}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 active:scale-95 transition-transform"
          >
            Записаться ещё раз
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingConfirmation;