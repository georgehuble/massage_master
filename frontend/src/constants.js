// API конфигурация
export const ADMIN_ID = import.meta.env.VITE_ADMIN_ID;
export const API_BASE = import.meta.env.VITE_API_BASE || "/api";

// Настройки времени и бронирования
export const BOOKING_COOLDOWN = 15000; // 15 seconds in milliseconds
export const MAX_DAYS_AHEAD = 14;
export const MIN_BOOKING_HOURS_AHEAD = 4;
export const SLOT_DURATION = 20; // 20 минут базовый слот
export const BUFFER_TIME = 20; // 20 минут перерыв между сеансами

// Пользователь
export const DEFAULT_USER_NAME = "Гость";

// API endpoints
export const API_ENDPOINTS = {
  SLOTS: `${API_BASE}/slots`,
  BOOK: `${API_BASE}/book`,
  CANCEL: `${API_BASE}/cancel`,
  RECORDS: `${API_BASE}/records`,
};

// Рабочие часы
export const WORKING_HOURS = {
  START: 9, // 9:00
  END: 21, // 21:00
  LUNCH_START: 13, // 13:00
  LUNCH_END: 14, // 14:00
};

// Шаги бронирования
export const BOOKING_STEPS = {
  TYPE: 'type',
  DATE: 'date', 
  TIME: 'time',
  CONFIRM: 'confirm',
};

// Периоды дня для группировки слотов
export const DAY_PERIODS = {
  MORNING: { start: 6, end: 12, icon: '🌅', name: 'Утро' },
  AFTERNOON: { start: 12, end: 17, icon: '☀️', name: 'День' },
  EVENING: { start: 17, end: 22, icon: '🌆', name: 'Вечер' },
};

// Статусы записи
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed', 
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
}; 