import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import BookingConfirmation from "./components/BookingConfirmation";
import MassageTypeSelector, { massageTypes } from "./components/MassageTypeSelector";
import TimeSlotGrid from "./components/TimeSlotGrid";
import AdminPanel from "./components/AdminPanel";
import CalendarGrid from "./components/CalendarGrid";

// Настройка dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('ru');

// Константы
const ADMIN_ID = import.meta.env.VITE_ADMIN_ID || "123456789";
const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const tg = window.Telegram?.WebApp;

// Компонент загрузки
const LoaderOverlay = ({ visible }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
    </div>
  );
};

// Инициализация Telegram WebApp
if (tg) {
  try {
    tg.ready();
    console.log("Telegram WebApp initialized successfully");
  } catch (error) {
    console.error("Error initializing Telegram WebApp:", error);
  }
} else {
  console.warn("Telegram WebApp not available - running in development mode");
}

const App = () => {
  // Состояния
  const [confirmedBookings, setConfirmedBookings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("confirmedBookings") || "[]");
    } catch (error) {
      console.error("Error parsing confirmedBookings from localStorage:", error);
      return [];
    }
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedMassageType, setSelectedMassageType] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => dayjs().add(4, "hour"));
  const [allRecords, setAllRecords] = useState([]);
  const [name, setName] = useState("Гость");
  const [isBlocked, setIsBlocked] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [isLoadingUI, setIsLoadingUI] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentStep, setCurrentStep] = useState('type'); // 'type', 'date', 'time', 'confirm'

  // Инициализация Telegram WebApp и получение данных пользователя
  useEffect(() => {
    console.log("Initializing app...");
    console.log("Telegram WebApp available:", !!tg);
    console.log("API_BASE:", API_BASE);
    console.log("ADMIN_ID:", ADMIN_ID);

    if (!tg) {
      console.warn("Telegram WebApp not available - using fallback mode");
      setIsInitialized(true);
      return;
    }

    try {
      tg.ready();
      console.log("Telegram WebApp ready");
      
      const userData = tg.initDataUnsafe;
      const user = userData?.user;
      
      console.log("User data:", user);
      
      if (user) {
        let displayName = "Гость";
        if (user.first_name || user.last_name || user.username) {
          displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || 
                        `@${user.username}` || 
                        `user${user.id}`;
        }

        setName(displayName);
        localStorage.setItem("userName", displayName);

        if (String(user.id) === String(ADMIN_ID)) {
          setIsAdmin(true);
          fetchAllRecords();
        }
      } else {
        // Пробуем восстановить имя из localStorage
        const cachedName = localStorage.getItem("userName");
        if (cachedName) {
          setName(cachedName);
        }
      }

      if (typeof tg.expand === 'function') {
        tg.expand();
      }
      setIsInitialized(true);
    } catch (error) {
      console.error("Ошибка инициализации Telegram WebApp:", error);
      setIsInitialized(true);
    }
  }, []);

  // Проверка времени с последней записи
  useEffect(() => {
    const last = localStorage.getItem("lastBookingTime");
    if (last) {
      const elapsed = Date.now() - parseInt(last, 10);
      if (elapsed < 15000) {
        setIsBlocked(true);
        setCountdown(Math.ceil((15000 - elapsed) / 1000));

        const interval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setIsBlocked(false);
              return 15;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(interval);
      }
    }
  }, []);

  // Получение свободных слотов для выбранной даты
  const { 
    data: slots = [], 
    refetch: refetchSlots, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ["slots", selectedDate ? selectedDate.format("YYYY-MM-DD") : "no-date", selectedMassageType?.id],
    queryFn: async () => {
      if (!selectedDate || !dayjs.isDayjs(selectedDate)) {
        throw new Error("Некорректная дата");
      }
      
      const params = new URLSearchParams({
        day: selectedDate.format("YYYY-MM-DD")
      });
      
      if (selectedMassageType) {
        params.append('massageType', selectedMassageType.id);
        params.append('duration', selectedMassageType.duration.toString());
      }
      
      const res = await fetch(`${API_BASE}/slots?${params}`);
      if (!res.ok) {
        throw new Error("Ошибка загрузки слотов");
      }
      return await res.json();
    },
    enabled: !isAdmin && !!selectedDate && dayjs.isDayjs(selectedDate) && !!selectedMassageType,
  });

  // Получение всех записей (только для админа)
  const fetchAllRecords = async () => {
    try {
      const res = await fetch(`${API_BASE}/records`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setAllRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Не удалось получить записи:", error);
      setAllRecords([]);
    }
  };

  // Бронирование слота
  const bookSlot = async () => {
    if (!selectedSlot || !selectedMassageType || isBlocked) return;
    setIsLoadingUI(true);

    let userNameForBooking = name;
    const user = tg?.initDataUnsafe?.user;
    if (userNameForBooking === "Гость" && user) {
      userNameForBooking = user.first_name + (user.last_name ? ` ${user.last_name}` : "") || `@${user.username}`;
    }

    try {
      const res = await fetch(`${API_BASE}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: userNameForBooking, 
          slot: selectedSlot,
          massageType: selectedMassageType.id,
          duration: selectedMassageType.duration
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        const bookingData = {
          slot: selectedSlot,
          massageType: selectedMassageType.id,
          name: userNameForBooking
        };
        
        const updated = [...confirmedBookings, bookingData];
        setConfirmedBookings(updated);
        localStorage.setItem("confirmedBookings", JSON.stringify(updated));
        localStorage.setItem("name", userNameForBooking);
        localStorage.setItem("lastBookingTime", Date.now().toString());

        if (tg?.sendData && typeof tg.sendData === 'function') {
          try {
            const dataToSend = JSON.stringify({
              slot: selectedSlot,
              name: userNameForBooking,
              massageType: selectedMassageType.id,
              massageName: selectedMassageType.name,
              price: selectedMassageType.price
            });
            tg.sendData(dataToSend);
          } catch (err) {
            console.error("Ошибка отправки данных в Telegram:", err);
          }
        }
        
        toast.success(`Вы записаны на ${selectedMassageType.name}!`);
        setIsBlocked(true);
        setCountdown(15);
        setCurrentStep('confirm');

        const interval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setIsBlocked(false);
              return 15;
            }
            return prev - 1;
          });
        }, 1000);
        
        if (refetchSlots) {
          await refetchSlots();
        }
      } else {
        toast.error("Ошибка: " + (data.detail || data.message || "Не удалось"));
      }
    } catch (error) {
      console.error("Ошибка бронирования:", error);
      toast.error("Ошибка соединения: " + error.message);
    } finally {
      setIsLoadingUI(false);
    }
  };

  // Генерация списка доступных дат
  useEffect(() => {
    const list = [];
    const now = dayjs();
    const cutoffTime = now.add(4, "hour");
    
    for (let i = 0; i < 14; i++) {
      const d = now.add(i, "day");
      // Исправленная логика: для сегодняшнего дня проверяем время, для остальных - добавляем всегда
      if (i === 0) {
        // Сегодня: проверяем, что текущее время плюс 4 часа не превышает конец дня
        if (d.isAfter(cutoffTime) || d.format('YYYY-MM-DD') !== now.format('YYYY-MM-DD')) {
          list.push(d);
        }
      } else {
        // Будущие дни: добавляем всегда
        list.push(d);
      }
    }
    setDates(list);
  }, []);

  // Отображение админ-панели
  if (isAdmin) {
    return (
      <AdminPanel 
        allRecords={allRecords} 
        onRefresh={fetchAllRecords}
      />
    );
  }

  // Показываем загрузку пока приложение инициализируется
  if (!isInitialized) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Инициализация приложения...</p>
        </div>
      </div>
    );
  }

  // Отображение подтверждения бронирования
  const showConfirmation = Array.isArray(confirmedBookings) && 
    confirmedBookings.some(booking => {
      try {
        const date = typeof booking === 'string' ? booking : booking.slot;
        return new Date(date) > new Date();
      } catch (error) {
        console.error('Invalid date in confirmedBookings:', booking);
        return false;
      }
    });
    
  if (showConfirmation) {
    return (
      <div className="p-4">
        <LoaderOverlay visible={isLoadingUI} />
        <BookingConfirmation
          bookings={confirmedBookings}
          onCancel={async () => {
            setIsLoadingUI(true);
            try {
              const response = await fetch(`${API_BASE}/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, slot: selectedSlot })
              });

              if (response.ok) {
                const updated = confirmedBookings.filter(
                  d => new Date(d).getTime() !== new Date(selectedSlot).getTime()
                );
                setConfirmedBookings(updated);
                toast.success("Запись успешно отменена!");
                localStorage.setItem("confirmedBookings", JSON.stringify(updated));
                if (refetchSlots) {
                  await refetchSlots();
                }
              } else {
                const errorData = await response.json();
                toast.error("Не удалось отменить запись. Попробуйте позже.");
              }
            } catch (error) {
              console.error("Ошибка отмены записи:", error);
              toast.error("Ошибка соединения. Попробуйте позже.");
            } finally {
              setIsLoadingUI(false);
            }
          }}
          onRebook={() => {
            setConfirmedBookings([]);
            localStorage.removeItem("confirmedBookings");
            setCurrentStep('type');
            setSelectedMassageType(null);
            setSelectedSlot(null);
          }}
        />
      </div>
    );
  }

  // Пошаговая навигация  
  const StepIndicator = () => (
    <div className="flex items-center justify-center space-x-2 mb-6">
      {['type', 'date', 'time'].map((step, index) => {
        const stepIndex = index + 1;
        const isActive = currentStep === step;
        const isCompleted = ['type', 'date', 'time'].indexOf(currentStep) > index;
        
        return (
          <div key={step} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
              ${isActive ? 'bg-blue-500 text-white' : 
                isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}
            `}>
              {isCompleted ? '✓' : stepIndex}
            </div>
            {index < 2 && (
              <div className={`w-8 h-0.5 mx-2 transition-all duration-300 ${
                isCompleted ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // Основной интерфейс записи
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <LoaderOverlay visible={isLoadingUI} />
      
      <div className="p-4 space-y-6">
        {/* Заголовок */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Запись на массаж
          </h1>
          <p className="text-gray-600">Здравствуйте, {name} 👋</p>
        </motion.div>

        <StepIndicator />

        <AnimatePresence mode="wait">
          {/* Шаг 1: Выбор типа массажа */}
          {currentStep === 'type' && (
            <motion.div
              key="step-type"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MassageTypeSelector
                selectedType={selectedMassageType}
                onTypeSelect={(type) => {
                  setSelectedMassageType(type);
                  setCurrentStep('date');
                  // Сброс выбранного слота при смене типа
                  setSelectedSlot(null);
                }}
              />
            </motion.div>
          )}

          {/* Шаг 2: Выбор даты */}
          {currentStep === 'date' && (
            <motion.div
              key="step-date"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Выберите дату
                </h3>
                <p className="text-sm text-gray-600">
                  Выбран: {selectedMassageType?.name} ({selectedMassageType?.duration} мин)
                </p>
              </div>
              
                             <CalendarGrid
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  setSelectedDate(date);
                  setCurrentStep('time');
                  setSelectedSlot(null);
                }}
                minAdvanceHours={4}
              />
              
              <button
                onClick={() => setCurrentStep('type')}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                ← Назад к выбору типа
              </button>
            </motion.div>
          )}

          {/* Шаг 3: Выбор времени */}
          {currentStep === 'time' && (
            <motion.div
              key="step-time"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <TimeSlotGrid
                slots={slots}
                selectedSlot={selectedSlot}
                onSlotSelect={(slot) => {
                  setSelectedSlot(slot);
                  if (tg && tg.HapticFeedback && typeof tg.HapticFeedback.selectionChanged === 'function') {
                    try {
                      tg.HapticFeedback.selectionChanged();
                    } catch (error) {
                      console.error("Error with haptic feedback:", error);
                    }
                  }
                }}
                selectedMassageType={selectedMassageType}
                isLoading={isLoading}
              />
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (tg && tg.HapticFeedback && typeof tg.HapticFeedback.impactOccurred === 'function') {
                      try {
                        tg.HapticFeedback.impactOccurred("medium");
                      } catch (error) {
                        console.error("Error with haptic feedback:", error);
                      }
                    }
                    bookSlot();
                  }}
                  disabled={isBlocked || !selectedSlot}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-semibold text-lg
                           hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed 
                           transition-all duration-300 transform hover:scale-[1.02] active:scale-98 shadow-lg"
                >
                  {isBlocked 
                    ? `Доступно через ${countdown} сек` 
                    : !selectedSlot 
                      ? "Выберите время" 
                      : `Записаться • ${selectedMassageType?.price}`
                  }
                </button>
                
                <button
                  onClick={() => setCurrentStep('date')}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                >
                  ← Изменить дату
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;