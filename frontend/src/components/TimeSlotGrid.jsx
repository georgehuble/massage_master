import React from 'react';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import LoadingSkeleton from './LoadingSkeleton';

const TimeSlotGrid = ({ slots, selectedSlot, onSlotSelect, selectedMassageType, isLoading }) => {
  if (isLoading) {
    return <LoadingSkeleton type="slots" />;
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="text-6xl">😔</div>
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Нет доступных слотов
          </h3>
          <p className="text-sm text-gray-600">
            На выбранную дату все время занято.<br/>
            Попробуйте выбрать другой день.
          </p>
        </div>
      </div>
    );
  }

  // Группируем слоты по времени дня
  const groupSlotsByPeriod = (slots) => {
    const morning = [];
    const afternoon = [];
    const evening = [];

    slots.forEach(slot => {
      const hour = dayjs(slot).hour();
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  };

  const { morning, afternoon, evening } = groupSlotsByPeriod(slots);

  const SlotButton = ({ slot, index }) => {
    const time = dayjs(slot);
    const isSelected = selectedSlot === slot;
    const isPast = time.isBefore(dayjs());
    
    return (
      <motion.button
        key={slot}
        layout
        onClick={() => !isPast && onSlotSelect(slot)}
        disabled={isPast}
        className={`
          relative p-3 rounded-xl text-center transition-all duration-300 font-medium
          ${isSelected 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105' 
            : isPast
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:shadow-md'
          }
        `}
        whileHover={!isPast ? { scale: isSelected ? 1.05 : 1.02 } : {}}
        whileTap={!isPast ? { scale: 0.98 } : {}}
        transition={{ duration: 0.2 }}
      >
        <div className="flex flex-col items-center space-y-1">
          <span className="text-lg font-bold">
            {time.format('HH:mm')}
          </span>
          {selectedMassageType && (
            <span className="text-xs opacity-75">
              до {time.add(selectedMassageType.duration, 'minute').format('HH:mm')}
            </span>
          )}

        </div>
        
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-white text-blue-500 rounded-full flex items-center justify-center text-sm font-bold shadow-md"
          >
            ✓
          </motion.div>
        )}
      </motion.button>
    );
  };

  const PeriodSection = ({ title, slots, icon }) => {
    if (slots.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-xl">{icon}</span>
          <h4 className="font-medium text-gray-700">{title}</h4>
          <span className="text-sm text-gray-500">({slots.length})</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot, index) => (
            <SlotButton key={slot} slot={slot} index={index} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Доступное время
        </h3>
        {selectedMassageType && (
          <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-xl">{selectedMassageType.icon}</span>
            <span className="text-sm text-blue-700 font-medium">
              {selectedMassageType.name} ({selectedMassageType.duration} мин)
            </span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <PeriodSection 
          title="Утро" 
          slots={morning} 
          icon="🌅"
        />
        <PeriodSection 
          title="День" 
          slots={afternoon} 
          icon="☀️"
        />
        <PeriodSection 
          title="Вечер" 
          slots={evening} 
          icon="🌆"
        />
      </div>

      {selectedSlot && selectedMassageType && (
        <motion.div
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200"
        >
          <div className="text-center">
            <p className="text-sm text-gray-700 mb-1">
              <span className="font-semibold">Выбранное время:</span>
            </p>
            <p className="text-lg font-bold text-gray-900">
              {dayjs(selectedSlot).format('HH:mm')} - {dayjs(selectedSlot).add(selectedMassageType.duration, 'minute').format('HH:mm')}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {selectedMassageType.name} • {selectedMassageType.duration} минут • {selectedMassageType.price}
            </p>
          </div>
        </motion.div>
      )}

      <div className="text-center">
        <p className="text-xs text-gray-500">
          💡 Время указано с учетом перерыва между сеансами
        </p>
      </div>
    </div>
  );
};

export default TimeSlotGrid; 