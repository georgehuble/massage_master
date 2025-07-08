import React from 'react';
import { motion } from 'framer-motion';

const massageTypes = [
  {
    id: 'classic',
    name: 'Классический массаж',
    duration: 60, // минуты
    price: '2500 ₽',
    description: 'Расслабляющий классический массаж',
    icon: '💆‍♂️',
    color: 'bg-blue-500'
  },
  {
    id: 'therapeutic', 
    name: 'Лечебный массаж',
    duration: 80,
    price: '3500 ₽', 
    description: 'Глубокий терапевтический массаж',
    icon: '🩺',
    color: 'bg-green-500'
  },
  {
    id: 'fullbody',
    name: 'Массаж всего тела',
    duration: 90,
    price: '4000 ₽',
    description: 'Полный комплексный массаж',
    icon: '🧘‍♀️', 
    color: 'bg-purple-500'
  },
  {
    id: 'express',
    name: 'Экспресс массаж',
    duration: 40,
    price: '1800 ₽',
    description: 'Быстрый точечный массаж',
    icon: '⚡',
    color: 'bg-orange-500'
  }
];

const MassageTypeSelector = ({ selectedType, onTypeSelect }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center text-gray-800">
        Выберите тип массажа
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        {massageTypes.map((type) => (
          <motion.button
            key={type.id}
            onClick={() => onTypeSelect(type)}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-300
              ${selectedType?.id === type.id 
                ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]' 
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }
            `}
            whileHover={{ scale: selectedType?.id === type.id ? 1.02 : 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-4">
              <div className={`
                w-12 h-12 rounded-full ${type.color} 
                flex items-center justify-center text-white text-xl
                shadow-md
              `}>
                {type.icon}
              </div>
              
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">{type.name}</h4>
                  <span className="text-lg font-bold text-gray-700">{type.price}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                    🕐 {type.duration} мин
                  </span>
                  {selectedType?.id === type.id && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-xs bg-blue-100 px-2 py-1 rounded-full text-blue-600 font-medium"
                    >
                      ✓ Выбрано
                    </motion.span>
                  )}
                </div>
              </div>
            </div>
            
            {selectedType?.id === type.id && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none"
                style={{
                  background: 'linear-gradient(45deg, transparent 49%, rgba(59, 130, 246, 0.1) 50%, transparent 51%)',
                }}
              />
            )}
          </motion.button>
        ))}
      </div>
      
      {selectedType && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200"
        >
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Выбран:</span> {selectedType.name}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Длительность: <span className="font-medium">{selectedType.duration} минут</span>
            {selectedType.duration > 60 && (
              <span className="text-xs ml-2 text-orange-600">
                + 20 мин перерыв включен автоматически
              </span>
            )}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export { massageTypes };
export default MassageTypeSelector; 