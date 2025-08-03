import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const massageTypes = [
  {
    id: 'classic',
    name: 'Классический массаж',
    description: 'Расслабляющий классический массаж',
    icon: '💆‍♂️',
    color: 'bg-blue-500',
    durations: [
      { time: 60, price: 2500 },
      { time: 90, price: 3500 }
    ]
  },
  {
    id: 'neck-shoulder',
    name: 'Массаж шейно-воротниковой зоны',
    description: 'Целенаправленный массаж шеи и плеч',
    icon: '🦴',
    color: 'bg-teal-500',
    durations: [
      { time: 30, price: 1500 }
    ]
  },
  {
    id: 'back',
    name: 'Массаж спины',
    description: 'Расслабляющий массаж спины',
    icon: '🔥',
    color: 'bg-red-500',
    durations: [
      { time: 30, price: 1800 }
    ]
  },
  {
    id: 'back-neck',
    name: 'Массаж спины и шейно-воротниковой зоны',
    description: 'Комплексный массаж спины и шеи',
    icon: '💪',
    color: 'bg-indigo-500',
    durations: [
      { time: 45, price: 2200 }
    ]
  },
  {
    id: 'stone',
    name: 'Массаж горячими камнями (стоун-терапия)',
    description: 'Расслабляющий массаж с горячими камнями',
    icon: '🪨',
    color: 'bg-amber-500',
    durations: [
      { time: 60, price: 3500 },
      { time: 90, price: 4800 }
    ]
  },
  {
    id: 'lymphatic',
    name: 'Лимфодренажный массаж',
    description: 'Массаж для улучшения лимфотока',
    icon: '💧',
    color: 'bg-cyan-500',
    durations: [
      { time: 60, price: 3000 },
      { time: 90, price: 4200 }
    ]
  },
  {
    id: 'anticellulite',
    name: 'Антицеллюлитный массаж',
    description: 'Интенсивный массаж против целлюлита',
    icon: '🔥',
    color: 'bg-pink-500',
    durations: [
      { time: 60, price: 3200 },
      { time: 90, price: 4500 }
    ]
  },
  {
    id: 'sports',
    name: 'Спортивный массаж',
    description: 'Массаж для спортсменов и активных людей',
    icon: '⚽',
    color: 'bg-emerald-500',
    durations: [
      { time: 60, price: 2800 },
      { time: 90, price: 4000 }
    ]
  },
  {
    id: 'cupping',
    name: 'Баночный динамический массаж',
    description: 'Массаж с использованием банок',
    icon: '🏺',
    color: 'bg-orange-500',
    durations: [
      { time: 30, price: 2000 }
    ]
  }
];

const MassageTypeSelector = ({ selectedType, selectedDuration, onTypeSelect, onDurationSelect, onNext }) => {
  const [localSelectedType, setLocalSelectedType] = useState(selectedType || null);
  const [localSelectedDuration, setLocalSelectedDuration] = useState(selectedDuration || null);

  const handleTypeSelect = (type) => {
    setLocalSelectedType(type);
    // Сбрасываем выбранную длительность при выборе нового типа
    setLocalSelectedDuration(null);
    
    if (onTypeSelect) onTypeSelect(type);
    if (onDurationSelect) onDurationSelect(null);
  };

  const handleDurationSelect = (duration) => {
    setLocalSelectedDuration(duration);
    if (onDurationSelect) onDurationSelect(duration);
  };

  const currentSelectedType = selectedType || localSelectedType;
  const currentSelectedDuration = selectedDuration || localSelectedDuration;

  const canProceed = currentSelectedType && currentSelectedDuration;

  return (
    <div className="space-y-4">
      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .btn-hover:hover {
            transform: scale(1.02);
          }
          .btn-active:active {
            transform: scale(0.98);
          }
          .smooth-expand {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .layout-smooth {
            will-change: transform;
          }
        `}
      </style>
      
      <h3 className="text-lg font-semibold text-center text-gray-800">
        Выберите тип массажа
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        {massageTypes.map((type) => (
          <motion.div
            key={type.id}
            className={`
              relative rounded-xl border-2 overflow-hidden
              ${currentSelectedType?.id === type.id 
                ? 'border-blue-500 bg-blue-50 shadow-lg' 
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }
            `}
            whileHover={{ scale: 1.01 }}
            layout="position"
            transition={{
              layout: {
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94]
              },
              default: {
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }
            }}
          >
            <button
              onClick={() => handleTypeSelect(type)}
              className="w-full text-left p-4"
            >
              <div className="flex items-center space-x-4">
                <div className={`
                  w-12 h-12 rounded-full ${type.color} 
                  flex items-center justify-center text-white text-xl
                  shadow-md
                `}>
                  {type.icon}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{type.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                </div>
              </div>
            </button>

            {/* Выбор длительности */}
            <AnimatePresence mode="wait">
              {currentSelectedType?.id === type.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
                  animate={{ 
                    opacity: 1, 
                    height: 'auto',
                    paddingTop: '1rem',
                    paddingBottom: '1rem'
                  }}
                  exit={{ 
                    opacity: 0, 
                    height: 0,
                    paddingTop: 0,
                    paddingBottom: 0
                  }}
                  transition={{ 
                    duration: 0.5,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    height: {
                      duration: 0.5,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }
                  }}
                  className="px-4"
                  style={{ overflow: 'hidden' }}
                >
                  <div className="border-t border-gray-200">
                    <div className="space-y-3 pt-4">
                      <p className="text-sm font-medium text-gray-700">Выберите длительность:</p>
                      <div className="flex flex-wrap gap-2">
                        {type.durations.map((duration, index) => (
                          <motion.button
                            key={`${type.id}-${duration.time}-${duration.price}`}
                            onClick={() => handleDurationSelect(duration)}
                            className={`
                              px-4 py-2 rounded-lg border transition-all duration-300
                              ${currentSelectedDuration?.time === duration.time && currentSelectedDuration?.price === duration.price
                                ? 'bg-blue-500 text-white border-blue-500 shadow-md' 
                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                              }
                            `}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ 
                              duration: 0.2,
                              ease: [0.4, 0, 0.2, 1]
                            }}
                          >
                            <div className="text-center">
                              <div className="font-medium">{duration.time} мин</div>
                              <div className="text-sm font-bold">{duration.price} ₽</div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                      
                      {/* Кнопка "Далее" внутри выбранного массажа */}
                      <AnimatePresence mode="wait">
                        {currentSelectedDuration && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200"
                          >
                            <div className="flex-1 min-h-[3rem] flex flex-col justify-center">
                              <motion.p 
                                key={`${currentSelectedDuration.time}-${currentSelectedDuration.price}`}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-sm text-gray-700"
                              >
                                {currentSelectedDuration.time} мин.
                              </motion.p>
                              <motion.p 
                                key={`price-${currentSelectedDuration.price}`}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: 0.1 }}
                                className="text-lg font-bold text-blue-600"
                              >
                                {currentSelectedDuration.price} ₽
                              </motion.p>
                            </div>
                            <motion.button
                              onClick={onNext}
                              className="ml-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold
                                       hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 
                                       active:scale-95 shadow-lg hover:shadow-xl btn-hover btn-active"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <div className="flex items-center space-x-2">
                                <span>Далее</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Индикатор выбора */}
            {currentSelectedType?.id === type.id && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none"
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export { massageTypes };
export default MassageTypeSelector;