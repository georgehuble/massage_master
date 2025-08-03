import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import BookingConfirmation from "./components/BookingConfirmation";
import MassageTypeSelector, { massageTypes } from "./components/MassageTypeSelector";
import TimeSlotGrid from "./components/TimeSlotGrid";
import AdminPanel from "./components/AdminPanel";
import CalendarGrid from "./components/CalendarGrid";
import SuccessNotification from "./components/SuccessNotification";
import ModernLoader from "./components/ModernLoader";
import RingLoader from "./components/RingLoader";

// Настройка dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('ru');
dayjs.tz.setDefault('Europe/Moscow');

// Константы
const ADMIN_ID = import.meta.env.VITE_ADMIN_ID || "123456789";

// Определяем API_BASE в зависимости от окружения
const API_BASE = "https://app.selesta-test.ru/api";
const tg = window.Telegram?.WebApp;



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
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedMassageType, setSelectedMassageType] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [allRecords, setAllRecords] = useState([]);
  const [name, setName] = useState("Гость");
  const [isBlocked, setIsBlocked] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [isLoadingUI, setIsLoadingUI] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentStep, setCurrentStep] = useState('type'); // 'type', 'date', 'time', 'confirm'
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

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
    queryKey: [
      "slots",
      selectedDate ? selectedDate.format("YYYY-MM-DD") : "no-date",
      selectedMassageType?.id,
      selectedDuration?.time
    ],
    queryFn: async () => {
      if (!selectedDate || !dayjs.isDayjs(selectedDate)) {
        throw new Error("Некорректная дата");
      }

      const params = new URLSearchParams({
        day: selectedDate.format("YYYY-MM-DD")
      });

      if (selectedMassageType && selectedDuration) {
        params.append('massageType', selectedMassageType.id);
        params.append('duration', selectedDuration.time.toString());
      }

      const res = await fetch(`${API_BASE}/slots?${params}`);
      if (!res.ok) {
        throw new Error("Ошибка загрузки слотов");
      }
      return await res.json();
    },
    enabled: !isAdmin && !!selectedDate && dayjs.isDayjs(selectedDate) && !!selectedMassageType && !!selectedDuration,
  });

  // Получение записей пользователя с сервера
  const {
    data: serverBookings = [],
    refetch: refetchUserBookings,
    isLoading: isLoadingBookings
  } = useQuery({
    queryKey: ["userBookings", name],
    queryFn: async () => {
      if (!name || name === "Гость") {
        return [];
      }
      
      try {
        const res = await fetch(`${API_BASE}/user-bookings/${encodeURIComponent(name)}`);
        if (!res.ok) {
          throw new Error("Ошибка загрузки записей");
        }
        return await res.json();
      } catch (error) {
        console.error("Ошибка получения записей пользователя:", error);
        return [];
      }
    },
    enabled: !isAdmin && !!name && name !== "Гость",
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  // Синхронизация localStorage с серверными данными
  useEffect(() => {
    console.log("Server bookings received:", serverBookings);
    console.log("Current confirmedBookings:", confirmedBookings);
    
    if (serverBookings.length > 0) {
      // Преобразуем серверные данные в формат localStorage
      const formattedBookings = serverBookings.map(booking => {
        const massageType = massageTypes.find(type => type.id === booking.massageType) || massageTypes[0];
        const duration = booking.duration || 60;
        const durationData = massageType.durations.find(d => d.time === duration) || massageType.durations[0];
        
        return {
          slot: booking.slot,
          massageType: booking.massageType || "classic",
          massageName: massageType.name,
          massagePrice: durationData?.price || 2500,
          massageDuration: duration,
          name: booking.name,
          eventId: booking.eventId
        };
      });
      
      console.log("Formatted bookings:", formattedBookings);
      setConfirmedBookings(formattedBookings);
      localStorage.setItem("confirmedBookings", JSON.stringify(formattedBookings));
    } else if (serverBookings.length === 0 && confirmedBookings.length > 0) {
      // Если на сервере нет записей, но в localStorage есть - очищаем localStorage
      console.log("Clearing localStorage - no server bookings");
      setConfirmedBookings([]);
      localStorage.removeItem("confirmedBookings");
    }
  }, [serverBookings]);

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
    if (!selectedSlot || !selectedMassageType || !selectedDuration || isBlocked) return;
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
          duration: selectedDuration.time
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
          massageName: selectedMassageType.name,
          massagePrice: selectedDuration.price,
          massageDuration: selectedDuration.time,
          name: userNameForBooking,
          eventId: data.eventId
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
              price: selectedDuration.price
            });
            tg.sendData(dataToSend);
          } catch (err) {
            console.error("Ошибка отправки данных в Telegram:", err);
          }
        }

        // Показываем уведомление об успешной записи
        const startTime = dayjs(selectedSlot).format('HH:mm');
        const endTime = dayjs(selectedSlot).add(selectedDuration.time, 'minute').format('HH:mm');
        const timeRange = `${startTime}-${endTime}`;
        setNotificationMessage(`Вы записаны на ${selectedMassageType.name} в ${timeRange}!`);
        setShowSuccessNotification(true);

        setIsBlocked(true);
        setCountdown(15);

        // Переходим к просмотру записей через небольшую задержку, чтобы пользователь увидел уведомление
        setTimeout(() => {
          setCurrentStep('confirm');
        }, 2000);

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
        
        // Обновляем записи пользователя
        if (refetchUserBookings) {
          await refetchUserBookings();
        }
      } else {
        console.error("Ошибка бронирования:", data.detail || data.message || "Не удалось");
      }
    } catch (error) {
      console.error("Ошибка бронирования:", error);
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
          <RingLoader size="3em" />
          <p className="text-gray-600 mt-4">Инициализация приложения...</p>
        </div>
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
              <div className={`w-8 h-0.5 mx-2 transition-all duration-300 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // Основной интерфейс записи
  return (
    <>
      <SuccessNotification
        show={showSuccessNotification}
        message={notificationMessage}
        onClose={() => setShowSuccessNotification(false)}
        duration={2500}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {isLoadingUI && <ModernLoader />}
        <div className="p-4 space-y-6">
          {/* Заголовок */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2"
          >
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Запись на массаж
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Здравствуйте, {name} 👋</p>

            {/* Кнопка для просмотра записей */}
            {isLoadingBookings ? (
              <div className="inline-flex items-center space-x-2 text-gray-500">
                <RingLoader size="1.5em" />
                <span>Загрузка записей...</span>
              </div>
            ) : confirmedBookings.length > 0 ? (
              <button
                onClick={() => setCurrentStep('confirm')}
                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors text-sm sm:text-base"
              >
                <span>📅</span>
                <span>Мои записи ({confirmedBookings.filter(booking => {
                  try {
                    const date = typeof booking === 'string' ? booking : booking.slot;
                    return new Date(date) > new Date();
                  } catch (error) {
                    return false;
                  }
                }).length})</span>
              </button>
            ) : null}
          </motion.div>

          <StepIndicator />

          <AnimatePresence mode="wait">
            {/* Просмотр записей */}
            {currentStep === 'confirm' && (
              <motion.div
                key="step-confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <BookingConfirmation
                  bookings={confirmedBookings}
                  onCancel={async (bookingToCancel) => {
                    setIsLoadingUI(true);
                    try {
                      const response = await fetch(`${API_BASE}/cancel`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: bookingToCancel.name,
                          slot: bookingToCancel.slot,
                          massageType: bookingToCancel.massageType || "classic",
                          eventId: bookingToCancel.eventId
                        })
                      });

                      if (response.ok) {
                        // Показываем уведомление об успешной отмене
                        const startTime = dayjs(bookingToCancel.slot).format('HH:mm');
                        const endTime = dayjs(bookingToCancel.slot).add(bookingToCancel.massageDuration || 60, 'minute').format('HH:mm');
                        const timeRange = `${startTime}-${endTime}`;
                        setNotificationMessage(`Запись на ${timeRange} успешно отменена!`);
                        setShowSuccessNotification(true);

                        if (refetchSlots) {
                          await refetchSlots();
                        }
                        
                        // Обновляем записи пользователя
                        if (refetchUserBookings) {
                          await refetchUserBookings();
                        }
                      } else {
                        const errorData = await response.json();
                        console.error("Не удалось отменить запись:", errorData);
                      }
                    } catch (error) {
                      console.error("Ошибка отмены записи:", error);
                    } finally {
                      setIsLoadingUI(false);
                    }
                  }}
                  onRebook={() => {
                    // НЕ очищаем существующие записи - просто возвращаемся к процессу бронирования
                    setCurrentStep('type');
                    setSelectedMassageType(null);
                    setSelectedDuration(null);
                    setSelectedSlot(null);
                  }}
                />
              </motion.div>
            )}

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
                  selectedDuration={selectedDuration}
                  onTypeSelect={(type) => {
                    setSelectedMassageType(type);
                    setSelectedDuration(null); // сбрасываем выбранную длительность
                  }}
                  onDurationSelect={(duration) => setSelectedDuration(duration)}
                  onNext={() => {
                    setCurrentStep('date');
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
                    Выбран: {selectedMassageType?.name} ({selectedDuration?.time} мин)
                  </p>
                </div>

                <CalendarGrid
                  selectedDate={selectedDate}
                  onDateSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                  }}
                  onNext={() => {
                    setCurrentStep('time');
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
                {/* Проверка: есть ли запись на выбранную дату */}
                {(() => {
                  const selectedDay = dayjs(selectedDate).format('YYYY-MM-DD');
                  const hasBookingForDay = confirmedBookings.some(booking =>
                    dayjs(booking.slot).format('YYYY-MM-DD') === selectedDay
                  );
                  if (hasBookingForDay) {
                    return (
                      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
                        <p className="font-semibold mb-1">У вас уже есть запись на этот день.</p>
                        <p>Чтобы изменить время, сначала удалите существующую запись.</p>
                      </div>
                    );
                  }
                  return (
                    <>
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
                        selectedMassageType={{
                          ...selectedMassageType,
                          duration: selectedDuration?.time,
                          price: selectedDuration?.price
                        }}
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
                              : `Записаться • ${selectedDuration?.price}`
                          }
                        </button>

                        <button
                          onClick={() => setCurrentStep('date')}
                          className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                        >
                          ← Изменить дату
                        </button>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default App;