import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';

const CalendarGrid = ({ selectedDate, onDateSelect, minAdvanceHours = 4 }) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  
  const today = dayjs();
  const minDate = today.add(minAdvanceHours, 'hour');
  
  // Генерируем дни для календаря
  const generateCalendarDays = (month) => {
    const startOfMonth = month.startOf('month');
    const endOfMonth = month.endOf('month');
    const startOfWeek = startOfMonth.startOf('week').add(1, 'day'); // Начинаем с понедельника
    const endOfWeek = endOfMonth.endOf('week').add(1, 'day');
    
    const days = [];
    let current = startOfWeek;
    
    while (current.isBefore(endOfWeek)) {
      days.push(current);
      current = current.add(1, 'day');
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays(currentMonth);
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const isDateAvailable = (date) => {
    // Не позволяем выбирать прошедшие даты
    if (date.isBefore(minDate, 'day')) return false;
    
    // Ограничиваем бронирование на 14 дней вперед
    if (date.isAfter(today.add(14, 'day'))) return false;
    
    return true;
  };

  const getDateStatus = (date) => {
    const isToday = date.isSame(today, 'day');
    const isTomorrow = date.isSame(today.add(1, 'day'), 'day');
    const isSelected = selectedDate && date.isSame(selectedDate, 'day');
    const isCurrentMonth = date.isSame(currentMonth, 'month');
    const isAvailable = isDateAvailable(date);
    
    return {
      isToday,
      isTomorrow,
      isSelected,
      isCurrentMonth,
      isAvailable,
    };
  };

  const DayCell = ({ date }) => {
    const { isToday, isTomorrow, isSelected, isCurrentMonth, isAvailable } = getDateStatus(date);
    
    const baseClasses = "w-12 h-12 rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all duration-300 relative";
    
    let dayClasses = baseClasses;
    
    if (!isCurrentMonth) {
      dayClasses += " text-gray-300 cursor-default";
    } else if (!isAvailable) {
      dayClasses += " text-gray-400 cursor-not-allowed bg-gray-50";
    } else if (isSelected) {
      dayClasses += " bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105";
    } else if (isToday) {
      dayClasses += " bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-md hover:shadow-lg";
    } else {
      dayClasses += " text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md cursor-pointer";
    }

    return (
      <motion.button
        onClick={() => isAvailable && isCurrentMonth && onDateSelect(date)}
        disabled={!isAvailable || !isCurrentMonth}
        className={dayClasses}
        whileHover={isAvailable && isCurrentMonth ? { scale: isSelected ? 1.05 : 1.02 } : {}}
        whileTap={isAvailable && isCurrentMonth ? { scale: 0.98 } : {}}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: isSelected ? 1.05 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <span className="text-lg font-bold">{date.date()}</span>
        
        {/* Индикаторы */}
        {isToday && !isSelected && (
          <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"></div>
        )}
        
        {isTomorrow && !isSelected && !isToday && (
          <div className="absolute -bottom-1 w-6 h-0.5 bg-orange-400 rounded-full"></div>
        )}
        
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-white text-blue-500 rounded-full flex items-center justify-center text-xs font-bold shadow-md"
          >
            ✓
          </motion.div>
        )}
      </motion.button>
    );
  };

  const formatMonthYear = (date) => {
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return `${months[date.month()]} ${date.year()}`;
  };

  const canNavigatePrev = currentMonth.isAfter(today, 'month');
  const canNavigateNext = currentMonth.isBefore(today.add(3, 'month'), 'month');

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
      {/* Заголовок календаря */}
      <div className="flex items-center justify-between">
        <motion.button
          onClick={() => canNavigatePrev && setCurrentMonth(currentMonth.subtract(1, 'month'))}
          disabled={!canNavigatePrev}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          whileHover={canNavigatePrev ? { scale: 1.1 } : {}}
          whileTap={canNavigatePrev ? { scale: 0.9 } : {}}
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>

        <motion.h3 
          key={currentMonth.month()}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-semibold text-gray-800"
        >
          {formatMonthYear(currentMonth)}
        </motion.h3>

        <motion.button
          onClick={() => canNavigateNext && setCurrentMonth(currentMonth.add(1, 'month'))}
          disabled={!canNavigateNext}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          whileHover={canNavigateNext ? { scale: 1.1 } : {}}
          whileTap={canNavigateNext ? { scale: 0.9 } : {}}
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.button>
      </div>

      {/* Заголовки дней недели */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="h-8 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {day}
            </span>
          </div>
        ))}
      </div>

      {/* Сетка дней */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMonth.month()}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-7 gap-1"
        >
          {calendarDays.map((date, index) => (
            <DayCell key={`${date.format('YYYY-MM-DD')}`} date={date} />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Легенда */}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        <div className="flex items-center justify-center space-x-6 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-blue-500"></div>
            <span className="text-gray-600">Сегодня</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-1 rounded-full bg-orange-400"></div>
            <span className="text-gray-600">Завтра</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span className="text-gray-600">Недоступно</span>
          </div>
        </div>
        
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200"
          >
            <p className="text-center text-sm">
              <span className="font-semibold text-gray-700">Выбрана дата:</span>
              <br />
              <span className="text-lg font-bold text-gray-900">
                {selectedDate.format('DD MMMM YYYY')} 
              </span>
              <span className="text-sm text-gray-600 ml-2">
                ({selectedDate.format('dddd')})
              </span>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CalendarGrid; 