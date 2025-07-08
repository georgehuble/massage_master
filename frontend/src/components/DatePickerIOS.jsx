import React, { useState } from 'react';
import DatePicker from 'react-mobile-datepicker';

const months = [
  'января', 'февраля', 'марта', 'апреля',
  'мая', 'июня', 'июля', 'августа',
  'сентября', 'октября', 'ноября', 'декабря'
];

const weekdays = [
  'воскресенье', 'понедельник', 'вторник', 'среда',
  'четверг', 'пятница', 'суббота'
];

const weekdaysShort = [
  'вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'
];

// Сгенерировать массив из 14 допустимых дат (с сегодняшнего дня)
const generateAllowedDates = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const result = [];
  for (let i = 0; i <= 14; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    result.push(date);
  }

  return result;
};

const allowedDates = generateAllowedDates();

const formatDateLabel = (date) => {
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const weekday = weekdays[date.getDay()];
  
  // Определяем если это сегодня или завтра
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const dateToCheck = new Date(date);
  dateToCheck.setHours(0, 0, 0, 0);
  
  if (dateToCheck.getTime() === today.getTime()) {
    return `Сегодня, ${day} ${month}`;
  } else if (dateToCheck.getTime() === tomorrow.getTime()) {
    return `Завтра, ${day} ${month}`;
  } else {
    return `${weekday}, ${day} ${month}`;
  }
};

const DatePickerIOS = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const now = new Date();
  now.setHours(0, 0, 0, 0); // сброс времени
  const max = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // +14 дней

  const handleSelect = (selectedDate) => {
    setIsOpen(false);
    onChange(selectedDate);
  };

  const dateConfig = {
    date: {
      options: allowedDates,
      format: (val) => formatDateLabel(val),
      caption: 'Дата',
      step: 1,
    },
  };

  return (
    <div className="w-full flex justify-center">
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ease-out font-medium text-lg relative overflow-hidden"
      >
        <div className="relative z-10 flex items-center justify-center space-x-2">
          <span className="text-xl">📅</span>
          <span>{value ? formatDateLabel(value) : 'Выберите дату'}</span>
        </div>
        <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
      </button>
      <style>{`
        .datepicker.ios {
          bottom: auto !important;
          top: 30% !important;
          transform: translateX(-50%) !important;
          left: 50% !important;
          width: 90%;
          max-width: 400px;
          border-radius: 12px;
          z-index: 1000;
          box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }
`}</style>
      <DatePicker
        isOpen={isOpen}
        value={value || allowedDates[0]}
        min={now}
        max={max}
        onSelect={handleSelect}
        onCancel={() => setIsOpen(false)}
        theme="ios"
        confirmText="Готово"
        cancelText="Отмена"
        dateConfig={dateConfig}
        showFormat="DD MMMM YYYY"

      />
    </div>
  );
};

export default DatePickerIOS;
