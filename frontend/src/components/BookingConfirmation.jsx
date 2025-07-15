import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { massageTypes } from './MassageTypeSelector';

const BookingConfirmation = ({ bookings, onCancel, onRebook }) => {
  // Безопасная проверка на существование bookings
  if (!bookings || !Array.isArray(bookings) || bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="p-4 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2"
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Мои записи
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
          >
            <div className="text-6xl mb-4">📅</div>
            <p className="text-gray-500 text-lg mb-6">Нет активных записей</p>
            <button
              onClick={onRebook}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-8 rounded-xl hover:from-blue-600 hover:to-purple-600 active:scale-95 transition-all duration-300 shadow-lg"
            >
              Записаться на массаж
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Фильтруем будущие записи и обрабатываем разные форматы данных
  const futureBookings = bookings.filter(booking => {
    try {
      const date = typeof booking === 'string' ? booking : booking.slot;
      return new Date(date) > new Date();
    } catch (error) {
      console.error('Invalid date in bookings:', booking);
      return false;
    }
  }).map(booking => {
    // Обрабатываем разные форматы данных
    if (typeof booking === 'string') {
      return {
        slot: booking,
        massageType: 'classic', // дефолтный тип для старых записей
        name: 'Пользователь'
      };
    }
    return booking;
  });

  if (futureBookings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="p-4 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2"
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Мои записи
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
          >
            <div className="text-6xl mb-4">⏰</div>
            <p className="text-gray-500 text-lg mb-6">Нет будущих записей</p>
            <button
              onClick={onRebook}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-8 rounded-xl hover:from-blue-600 hover:to-purple-600 active:scale-95 transition-all duration-300 shadow-lg"
            >
              Записаться на массаж
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Сортируем записи по дате
  const sortedBookings = futureBookings.sort((a, b) => new Date(a.slot) - new Date(b.slot));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-4 space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Мои записи
          </h1>
          <p className="text-gray-600">
            У вас {sortedBookings.length} {sortedBookings.length === 1 ? 'запись' : 'записи'} 📅
          </p>
        </motion.div>

        {/* Компактный список записей */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="divide-y divide-gray-100">
            <AnimatePresence>
              {sortedBookings.map((booking, index) => {
                const massageType = massageTypes.find(type => type.id === booking.massageType) || massageTypes[0];
                
                let formattedDate, formattedTime, shortDate;
                try {
                  const bookingDate = new Date(booking.slot);
                  formattedDate = bookingDate.toLocaleDateString('ru-RU', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  });
                  formattedTime = bookingDate.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  shortDate = bookingDate.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                  });
                } catch (error) {
                  console.error('Error formatting date:', booking.slot);
                  formattedDate = 'Неизвестная дата';
                  formattedTime = 'Неизвестное время';
                  shortDate = 'Неизвестно';
                }

                return (
                  <motion.div
                    key={`${booking.slot}-${booking.massageType}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      {/* Левая часть - иконка и основная информация */}
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`
                          w-10 h-10 rounded-xl ${massageType.color} 
                          flex items-center justify-center text-white text-lg
                          shadow-md flex-shrink-0
                        `}>
                          {massageType.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {massageType.name}
                            </h3>
                            <span className="text-sm font-bold text-gray-700">
                              {massageType.price}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <span>📅</span>
                              <span className="font-medium">{formattedDate}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <span>🕐</span>
                              <span className="font-medium">{formattedTime}</span>
                            </span>
                            <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                              {massageType.duration} мин
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Правая часть - кнопка отмены */}
                      <div className="flex-shrink-0 ml-4">
                        <button
                          onClick={() => onCancel(booking)}
                          className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-colors duration-200 active:scale-95"
                          title="Отменить запись"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center pt-4 space-y-3"
        >
          <button
            onClick={onRebook}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-8 rounded-xl hover:from-blue-600 hover:to-purple-600 active:scale-95 transition-all duration-300 shadow-lg font-medium"
          >
            ➕ Записаться ещё раз
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingConfirmation;