import React from "react";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { toast } from "react-toastify";
import DatePickerIOS from "./components/ui/DatePickerIOS";
import BookingConfirmation from "./components/ui/BookingConfirmation";
import { useQuery } from "@tanstack/react-query";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('ru');

const ADMIN_ID = import.meta.env.VITE_ADMIN_ID;
const API_BASE = import.meta.env.VITE_API_BASE;
const tg = window.Telegram?.WebApp;

// Определяем, находимся ли мы в режиме отладки
const isDebugMode = window.location.search.includes('tgWebAppDebug=1');

const LoaderOverlay = ({ visible }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
    </div>
  );
};

// Проверяем правильность подключения Telegram API
function checkTelegramConnection() {
  let status = "Неизвестно";
  let details = {};
  
  if (!window.Telegram) {
    status = "Ошибка: Объект Telegram отсутствует";
    console.error(status);
  } else if (!window.Telegram.WebApp) {
    status = "Ошибка: Объект WebApp отсутствует";
    console.error(status);
  } else {
    try {
      // Проверяем, содержит ли URL хэш и валидный параметр initData
      const searchParams = new URLSearchParams(window.location.search);
      const hasInitData = searchParams.has('tgWebAppData');
      const hasProperWebView = window.Telegram.WebApp?.initParams?.tgWebAppVersion;
      
      details = {
        hasInitData,
        hasProperWebView,
        userAgent: navigator.userAgent,
        isTelegramBrowser: /telegram/i.test(navigator.userAgent),
        initParamsEmpty: !window.Telegram.WebApp?.initParams || 
                         Object.keys(window.Telegram.WebApp?.initParams || {}).length === 0
      };
      
      if (hasInitData && hasProperWebView) {
        status = "Подключение в порядке";
      } else if (!hasInitData) {
        status = "Ошибка: Отсутствует tgWebAppData в URL";
        console.warn(status);
      } else if (!hasProperWebView) {
        status = "Ошибка: WebApp запущен не в Telegram";
        console.warn(status);
      }
    } catch (e) {
      status = "Ошибка при проверке: " + e.message;
      console.error(status);
    }
  }
  
  console.log("[TG CONNECTION STATUS]", status, details);
  return { status, details };
}

// Выполняем проверку соединения
const connectionStatus = checkTelegramConnection();

// Инициализируем debug-логгер
const debugLog = (message, data = null) => {
  if (isDebugMode) {
    const logMsg = data ? `${message}: ${JSON.stringify(data)}` : message;
    console.log(`[WEBAPP DEBUG] ${logMsg}`);
    
    // Добавляем сообщение в UI, если включен режим отладки
    const debugElement = document.getElementById('tg-webapp-debug-logs');
    if (debugElement) {
      const msgElement = document.createElement('div');
      msgElement.className = 'debug-log-item';
      msgElement.textContent = logMsg;
      debugElement.appendChild(msgElement);
      
      // Прокручиваем к последнему сообщению
      debugElement.scrollTop = debugElement.scrollHeight;
    }
  }
};

if (tg) {
  tg.ready();
  debugLog('Telegram WebApp готов');
  
  // Подписываемся на события в режиме отладки
  if (isDebugMode) {
    tg.onEvent('viewportChanged', data => debugLog('viewportChanged', data));
    tg.onEvent('themeChanged', () => debugLog('themeChanged'));
    tg.onEvent('mainButtonClicked', () => debugLog('mainButtonClicked'));
    tg.onEvent('backButtonClicked', () => debugLog('backButtonClicked'));
    tg.onEvent('settingsButtonClicked', () => debugLog('settingsButtonClicked'));
    tg.onEvent('invoiceClosed', data => debugLog('invoiceClosed', data));
    tg.onEvent('popupClosed', data => debugLog('popupClosed', data));
    tg.onEvent('qrTextReceived', data => debugLog('qrTextReceived', data));
    tg.onEvent('clipboardTextReceived', data => debugLog('clipboardTextReceived', data));
  }
} else {
  console.error("Telegram WebApp не доступен при загрузке");
  debugLog("Telegram WebApp не доступен при загрузке");
}

const BookingApp = () => {
  const [confirmedBookings, setConfirmedBookings] = useState(() => JSON.parse(localStorage.getItem("confirmedBookings") || "[]"));
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs().add(4, "hour"));
  const [allRecords, setAllRecords] = useState([]);
  const [name, setName] = useState("Гость");
  const [isBlocked, setIsBlocked] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [telegramUserDataDump, setTelegramUserDataDump] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const [isLoadingUI, setIsLoadingUI] = useState(false);

  useEffect(() => {
    if (!tg) {
      debugLog("Ошибка: tg объект не определен. WebApp не инициализирован.");
      return;
    }
    try {
      tg.ready();
      debugLog("Telegram WebApp инициализирован");
      
      // Собираем информацию для отладки
      const debug = {
        version: tg.version,
        platform: tg.platform,
        colorScheme: tg.colorScheme,
        themeParams: tg.themeParams,
        isExpanded: tg.isExpanded,
        viewportHeight: tg.viewportHeight,
        viewportStableHeight: tg.viewportStableHeight,
        headerColor: tg.headerColor,
        backgroundColor: tg.backgroundColor,
        isClosingConfirmationEnabled: tg.isClosingConfirmationEnabled
      };
      
      setDebugInfo(debug);
      debugLog("Debug информация", debug);
      
      // Проверяем детально initDataUnsafe
      const userData = tg.initDataUnsafe;
      const initDataStr = JSON.stringify(userData);
      setTelegramUserDataDump(initDataStr);
      
      // Расширенная диагностика инициализации
      debugLog("initDataUnsafe - Наличие данных", { 
        exists: !!userData,
        isEmpty: Object.keys(userData || {}).length === 0,
        hasUser: !!userData?.user,
        raw: initDataStr?.substring(0, 100) + "..."
      });
      
      const user = userData?.user;
      if (user) {
        debugLog("Доступные данные пользователя", {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          language_code: user.language_code
        });
        
        let displayName = "Гость";
        if (user.first_name || user.last_name || user.username) {
          displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || `@${user.username}` || `user${user.id}`;
        }
        
        setName(displayName);
        debugLog("Установлено имя пользователя", { name: displayName });
        
        // Кэшируем имя в localStorage для будущего использования
        localStorage.setItem("userName", displayName);
        
        if (String(user.id) === ADMIN_ID) {
          setIsAdmin(true);
          fetchAllRecords();
          debugLog("Пользователь является администратором");
        }
      } else {
        // Пробуем восстановить имя из localStorage
        const cachedName = localStorage.getItem("userName");
        if (cachedName) {
          setName(cachedName);
          debugLog("Имя пользователя восстановлено из кэша", { name: cachedName });
        } else {
          debugLog("Информация о пользователе отсутствует в initDataUnsafe");
        }
      }
      
      // Проверка наличия hash параметра
      if (isDebugMode) {
        const hash = window.location.hash;
        debugLog("URL hash параметр", { hash: hash || "отсутствует" });
      }
      
      tg.expand?.();
      debugLog("WebApp развернут");
    } catch (error) {
      console.error("Ошибка инициализации Telegram WebApp:", error);
      debugLog("Ошибка инициализации", { error: error.message });
    }
  }, []);

  useEffect(() => {
    const last = localStorage.getItem("lastBookingTime");
    if (last) {
      const elapsed = Date.now() - parseInt(last, 10);
      if (elapsed < 15000) {
        setIsBlocked(true);
        setCountdown(Math.ceil((15000 - elapsed) / 1000));
        debugLog("Блокировка записи активирована", { countdown: Math.ceil((15000 - elapsed) / 1000) });
        
        const interval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setIsBlocked(false);
              debugLog("Блокировка записи деактивирована");
              return 15;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(interval);
      }
    }
  }, []);

  const { data: slots = [], refetch: refetchSlots, isLoading, isError } = useQuery({
    queryKey: ["slots", selectedDate.format("YYYY-MM-DD")],
    queryFn: async () => {
      debugLog("Запрос слотов", { date: selectedDate.format("YYYY-MM-DD") });
      const res = await fetch(`${API_BASE}/slots?day=${selectedDate.format("YYYY-MM-DD")}`);
      if (!res.ok) {
        debugLog("Ошибка загрузки слотов", { status: res.status });
        throw new Error("Ошибка загрузки слотов");
      }
      const data = await res.json();
      debugLog("Получены слоты", { count: data.length });
      return data;
    },
    enabled: !isAdmin && !!selectedDate,
  });

  const fetchAllRecords = async () => {
    debugLog("Запрос всех записей");
    try {
      const res = await fetch(`${API_BASE}/records`);
      const data = await res.json();
      setAllRecords(data);
      debugLog("Получены все записи", { count: data.length });
    } catch (error) {
      debugLog("Ошибка при получении записей", { error: error.message });
    }
  };

  const bookSlot = async () => {
    if (!selectedSlot || isBlocked) return;
    debugLog("Попытка записи", { slot: selectedSlot });
    setIsLoadingUI(true); // 👈 Показать лоадер

    let userNameForBooking = name;
    const user = tg?.initDataUnsafe?.user;
    if (userNameForBooking === "Гость" && user) {
      userNameForBooking = user.first_name + (user.last_name ? ` ${user.last_name}` : "") || `@${user.username}`;
      debugLog("Имя для записи обновлено", { name: userNameForBooking });
    }

    try {
      debugLog("Отправка запроса на запись", { name: userNameForBooking, slot: selectedSlot });
      const res = await fetch(`${API_BASE}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userNameForBooking, slot: selectedSlot }),
      });

      const data = await res.json();
      debugLog("Ответ сервера на запись", data);

      if (data.success) {
        const updated = [...confirmedBookings, selectedSlot];
        setConfirmedBookings(updated);
        localStorage.setItem("confirmedBookings", JSON.stringify(updated));
        localStorage.setItem("name", userNameForBooking);
        localStorage.setItem("lastBookingTime", Date.now().toString());
        debugLog("Запись успешно создана и сохранена локально");

        if (tg?.sendData) {
          try {
            const dataToSend = JSON.stringify({ slot: selectedSlot, name: userNameForBooking });
            debugLog("Отправка данных в Telegram", { data: dataToSend });
            tg.sendData(dataToSend);
            debugLog("Данные успешно отправлены в Telegram");
          } catch (err) {
            console.error("Ошибка отправки данных в Telegram:", err);
            debugLog("Ошибка отправки данных в Telegram", { error: err.message });
          }
          finally {
            setIsLoadingUI(false); // 👈 Скрыть лоадер
          }
        }
        toast.success("Вы успешно записаны!");
        setIsBlocked(true);
        setCountdown(15);
        debugLog("Активирована блокировка повторной записи");
        
        const interval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setIsBlocked(false);
              debugLog("Блокировка записи снята");
              return 15;
            }
            return prev - 1;
          });
        }, 1000);
        await refetchSlots();
      } else {
        toast.error("Ошибка: " + (data.detail || "Не удалось"));
        debugLog("Ошибка при записи", { detail: data.detail });
      }
    } catch (error) {
      debugLog("Исключение при записи", { error: error.message });
      toast.error("Ошибка соединения: " + error.message);
    }
  };

  useEffect(() => {
    const list = [];
    const now = dayjs();
    for (let i = 0; i < 14; i++) {
      const d = now.add(i, "day");
      if (d.isAfter(now.add(4, "hour"))) list.push(d);
    }
    setDates(list);
    debugLog("Сгенерирован список дат", { count: list.length });
  }, []);

  // Компонент для отображения debug информации
  const DebugPanel = () => {
    if (!isDebugMode) return null;
    
    return (
      <div className="mt-4 p-2 border border-gray-300 rounded bg-gray-100">
        <h3 className="text-sm font-bold mb-2">Debug Информация</h3>
        
        {/* Статус подключения */}
        <div className="mb-3 p-2 rounded" style={{
          backgroundColor: connectionStatus.status.includes('Ошибка') ? '#fecaca' : 
                          connectionStatus.status.includes('порядке') ? '#d1fae5' : '#fef3c7'
        }}>
          <p className="font-bold text-xs">Статус подключения: {connectionStatus.status}</p>
          {connectionStatus.details && (
            <div className="text-xs mt-1">
              <p>Данные в URL: {connectionStatus.details.hasInitData ? '✓' : '✗'}</p>
              <p>WebView Telegram: {connectionStatus.details.hasProperWebView ? '✓' : '✗'}</p>
              <p>Телеграм браузер: {connectionStatus.details.isTelegramBrowser ? '✓' : '✗'}</p>
            </div>
          )}
        </div>
        
        <div className="text-xs space-y-1">
          <p><strong>Пользователь:</strong> {name !== "Гость" ? name : "Не определен"}</p>
          <p><strong>WebApp версия:</strong> {debugInfo.version || "Н/Д"}</p>
          <p><strong>Платформа:</strong> {debugInfo.platform || "Н/Д"}</p>
          <p><strong>Цветовая схема:</strong> {debugInfo.colorScheme || "Н/Д"}</p>
          <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 30)}...</p>
          
          {telegramUserDataDump ? (
            <details className="mt-2">
              <summary className="cursor-pointer">initData (раскрыть)</summary>
              <pre className="mt-1 p-1 bg-gray-200 rounded overflow-x-auto">
                {telegramUserDataDump}
              </pre>
            </details>
          ) : (
            <p className="text-red-500 font-bold">⚠️ initData отсутствует!</p>
          )}
          
          <div className="mt-2">
            <p className="font-semibold">WebApp события:</p>
            <div id="tg-webapp-debug-logs" className="mt-1 max-h-24 overflow-y-auto bg-gray-200 p-1 rounded">
              <div className="text-gray-500 italic">Здесь будут отображаться события WebApp</div>
            </div>
          </div>
          
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button 
              onClick={() => {
                debugLog("Тестовая кнопка нажата");
                if (tg) tg.showAlert("Тестовое сообщение");
              }}
              className="text-xs px-2 py-1 bg-blue-500 text-white rounded"
            >
              Показать Alert
            </button>
            <button 
              onClick={() => {
                debugLog("Тест HapticFeedback");
                if (tg) {
                  tg.HapticFeedback.impactOccurred("light");
                  setTimeout(() => tg.HapticFeedback.notificationOccurred("success"), 500);
                }
              }}
              className="text-xs px-2 py-1 bg-green-500 text-white rounded"
            >
              Тест Haptic
            </button>
            <button 
              onClick={() => {
                const data = tg?.initDataUnsafe;
                debugLog("initDataUnsafe при нажатии кнопки", data);
                alert(`User в initDataUnsafe: ${data?.user ? 'ЕСТЬ' : 'НЕТ'}\nData: ${JSON.stringify(data || {}).substring(0, 100)}...`);
              }}
              className="text-xs px-2 py-1 bg-yellow-500 text-white rounded"
            >
              Проверить initData
            </button>
            <button 
              onClick={() => {
                try {
                  const test = { time: new Date().toISOString(), debug: true };
                  debugLog("Отправка тестовых данных в Telegram");
                  tg?.sendData(JSON.stringify(test));
                  alert("Данные отправлены в Telegram");
                } catch(e) {
                  alert("Ошибка: " + e.message);
                }
              }}
              className="text-xs px-2 py-1 bg-purple-500 text-white rounded"
            >
              Тест sendData
            </button>
          </div>
          
          {/* Восстановление имени из localStorage */}
          <div className="mt-2 border-t pt-2">
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="border p-1 text-xs w-full rounded"
              placeholder="Введите имя вручную"
            />
            <div className="flex space-x-2 mt-1">
              <button
                onClick={() => {
                  localStorage.setItem("userName", name);
                  debugLog("Имя сохранено вручную", { name });
                  alert("Имя сохранено!");
                }}
                className="text-xs flex-1 px-2 py-1 bg-blue-500 text-white rounded"
              >
                Сохранить
              </button>
              <button
                onClick={() => {
                  const saved = localStorage.getItem("userName");
                  if (saved) {
                    setName(saved);
                    debugLog("Имя восстановлено из localStorage", { name: saved });
                  } else {
                    alert("Сохраненное имя не найдено");
                  }
                }}
                className="text-xs flex-1 px-2 py-1 bg-gray-500 text-white rounded"
              >
                Восстановить
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isAdmin) {
    return (
      <div className="p-4 space-y-4 relative">
      <LoaderOverlay visible={isLoadingUI} />
        <h2 className="text-center text-xl font-bold">Все записи</h2>
        {allRecords.map((r, i) => (
          <div key={i} className="border p-2 rounded">
            {r.name} — {dayjs(r.slot).format("DD.MM.YYYY HH:mm")}
          </div>
        ))}
        <DebugPanel />
      </div>
    );
  }

  const showConfirmation = confirmedBookings.some(d => new Date(d) > new Date());
  if (showConfirmation) {
    return (
      <div className="p-4">
        <LoaderOverlay visible={isLoadingUI} />
        <BookingConfirmation
          bookings={confirmedBookings}
          onCancel={async () => {
            setIsLoadingUI(true); // 👈 Показать лоадер
            debugLog("Попытка отмены бронирования", { slot: selectedSlot });
            try {
              const response = await fetch(`${API_BASE}/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, slot: selectedSlot })
              });
              
              if (response.ok) {
                const updated = confirmedBookings.filter(d => new Date(d).getTime() !== new Date(selectedSlot).getTime());
                setConfirmedBookings(updated);
                toast.success("Запись успешно отменена!");
                localStorage.setItem("confirmedBookings", JSON.stringify(updated));
                debugLog("Бронирование успешно отменено");
                await refetchSlots();
              } else {
                const errorData = await response.json();
                debugLog("Ошибка при отмене бронирования", errorData);
                alert("Не удалось отменить запись. Попробуйте позже.");
              }
            } catch (error) {
              debugLog("Исключение при отмене бронирования", { error: error.message });
              alert("Ошибка соединения. Попробуйте позже.");
            }
            finally {
              setIsLoadingUI(false); // 👈 Скрыть лоадер
            }
          }}
          onRebook={() => {
            setConfirmedBookings([]);
            localStorage.removeItem("confirmedBookings");
            debugLog("Очищены все бронирования для новой записи");
          }}
        />
        <DebugPanel />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 relative">
      <LoaderOverlay visible={isLoadingUI} />
      <h2 className="text-center text-xl font-bold">Запись на массаж</h2>
      <p className="text-center text-sm text-gray-500">Здравствуйте, {name}</p>
      
      {name === "Гость" && telegramUserDataDump && (
        <div className="p-2 bg-gray-100 text-xs text-gray-700 rounded-md overflow-hidden">
          <p>Диагностика WebApp: {telegramUserDataDump.substring(0, 50)}...</p>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-center font-medium">Выберите дату и время</p>
        <DatePickerIOS
          value={selectedDate.toDate()}
          onChange={(d) => {
            const newDate = dayjs(d);
            setSelectedDate(newDate);
            debugLog("Выбрана новая дата", { date: newDate.format("YYYY-MM-DD") });
            
            const nearestSlot = slots.find((slot) => dayjs(slot).isSame(newDate, "minute"));
            if (nearestSlot) {
              setSelectedSlot(nearestSlot);
              debugLog("Автоматически выбран ближайший слот", { slot: nearestSlot });
            }
          }}
        />
      </div>

      {isLoading && <p className="text-center text-gray-500">Загрузка слотов...</p>}
      {isError && <p className="text-center text-red-500">Ошибка загрузки слотов</p>}

      {slots.length > 0 && (
        <div>
          <p className="text-center font-medium mb-2">Свободные слоты</p>
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedSlot(slot);
                  debugLog("Выбран слот", { slot, index: i });
                  if (tg && tg.HapticFeedback) {
                    tg.HapticFeedback.selectionChanged();
                  }
                }}
                className={`rounded p-2 text-center text-sm ${slot === selectedSlot ? "bg-blue-600 text-white" : "bg-white border"}`}
              >
                {dayjs(slot).format("HH:mm")}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => {
          debugLog("Кнопка записи нажата", {
            isBlocked,
            selectedSlot
          });
          if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred("medium");
          }
          bookSlot();
        }}
        disabled={isBlocked || !selectedSlot}
        className="w-full rounded bg-green-600 text-white py-2 font-medium mt-4 hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isBlocked ? `Доступно через ${countdown} сек` : !selectedSlot ? "Выберите время" : "Записаться"}
      </button>
      
      <DebugPanel />
    </div>
  );
};

export default BookingApp;