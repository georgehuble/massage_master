import React, { useState } from 'react';
import DatePicker from 'react-mobile-datepicker';

const months = [
  'января', 'февраля', 'марта', 'апреля',
  'мая', 'июня', 'июля', 'августа',
  'сентября', 'октября', 'ноября', 'декабря'
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
  return `${day} ${month} ${year} г.`;
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
        className="w-full bg-green-500 text-white py-3 rounded-lg shadow hover:bg-green-600 transition duration-200 ease-in-out"
      >
        {value ? formatDateLabel(value) : 'Выберите дату'}
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
