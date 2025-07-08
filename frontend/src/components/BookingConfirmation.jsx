import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BookingConfirmation = ({ bookings, onCancel, onRebook }) => {
  // Безопасная проверка на существование bookings и получение ближайшей даты
  if (!bookings || !Array.isArray(bookings) || bookings.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Нет активных записей</p>
        <button
          onClick={onRebook}
          className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 active:scale-95 transition-transform mt-4"
        >
          Записаться
        </button>
      </div>
    );
  }

  const futureBookings = bookings.filter(date => {
    try {
      return new Date(date) > new Date();
    } catch (error) {
      console.error('Invalid date in bookings:', date);
      return false;
    }
  });

  if (futureBookings.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Нет будущих записей</p>
        <button
          onClick={onRebook}
          className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 active:scale-95 transition-transform mt-4"
        >
          Записаться
        </button>
      </div>
    );
  }

  const nearest = futureBookings.sort((a, b) => new Date(a) - new Date(b))[0];
  
  let formattedDate;
  try {
    formattedDate = new Date(nearest).toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', nearest);
    formattedDate = 'Неизвестная дата';
  }

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