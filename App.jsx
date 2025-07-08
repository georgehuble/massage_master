import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('ru');

const ADMIN_ID = import.meta.env.VITE_ADMIN_ID;
const API_BASE = import.meta.env.VITE_API_BASE;

if (!API_BASE) {
  console.error('VITE_API_BASE не определен в переменных окружения');
}

const tg = window.Telegram?.WebApp;

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => dayjs().add(4, "hour"));
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSlots = useCallback(async (date) => {
    if (!API_BASE) return;
    
    setLoading(true);
    setError(null);
    try {
      const day = date.format("YYYY-MM-DD");
      const res = await fetch(`${API_BASE}/slots?day=${day}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setSlots(data);
    } catch (err) {
      console.error('Ошибка загрузки слотов:', err);
      setError('Не удалось загрузить доступные слоты');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllRecords = useCallback(async () => {
    if (!API_BASE) return;
    
    setAdminLoading(true);
    try {
      const res = await fetch(`${API_BASE}/records`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setAllRecords(data);
    } catch (err) {
      console.error('Ошибка загрузки записей:', err);
      setAllRecords([]);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  const bookSlot = async () => {
    if (!selectedSlot || !API_BASE) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tg?.initDataUnsafe?.user?.first_name || "Гость",
          slot: selectedSlot,
        }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        const successMessage = "Вы записаны!";
        if (tg && typeof tg.showAlert === 'function') {
          tg.showAlert(successMessage);
        } else {
          alert(successMessage);
        }
        setSelectedSlot(null);
        fetchSlots(selectedDate);
      } else {
        // Показываем детальную ошибку от сервера
        const errorMessage = data.detail || data.message || "Ошибка при записи";
        if (tg && typeof tg.showAlert === 'function') {
          tg.showAlert(errorMessage);
        } else {
          alert(errorMessage);
        }
      }
    } catch (err) {
      console.error('Ошибка бронирования:', err);
      const errorMessage = "Ошибка соединения с сервером";
      if (tg && typeof tg.showAlert === 'function') {
        tg.showAlert(errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userId = tg?.initDataUnsafe?.user?.id;
    if (ADMIN_ID && userId && String(userId) === String(ADMIN_ID)) {
      setIsAdmin(true);
      fetchAllRecords();
    } else {
      fetchSlots(selectedDate);
    }
    
    if (tg && typeof tg.expand === 'function') {
      tg.expand();
    }
  }, [fetchAllRecords, fetchSlots, selectedDate]);

  useEffect(() => {
    const list = [];
    const now = dayjs();
    const cutoffTime = now.add(4, "hour");
    
    for (let i = 0; i < 14; i++) {
      const d = now.add(i, "day");
      // Для сегодняшнего дня проверяем, что время больше cutoff
      // Для будущих дней проверяем, что это не прошедший день
      if (i === 0) {
        // Сегодня: проверяем время
        if (d.hour() >= cutoffTime.hour() || d.isAfter(cutoffTime, 'day')) {
          list.push(d);
        }
      } else {
        // Будущие дни: добавляем всегда
        list.push(d);
      }
    }
    setDates(list);
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, isAdmin, fetchSlots]);

  if (isAdmin) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-center text-xl font-bold">Все записи</h2>
        
        {adminLoading ? (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Загрузка записей...</p>
          </div>
        ) : allRecords.length === 0 ? (
          <p className="text-center text-gray-500">Нет записей</p>
        ) : (
          allRecords.map((r, i) => (
            <div key={`${r.slot}-${r.name}-${i}`} className="border p-2 rounded">
              {r.name} — {dayjs(r.slot).format("DD.MM.YYYY HH:mm")}
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-center text-xl font-bold">Запись на массаж</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div>
        <p className="text-center font-medium mb-2">Выберите дату</p>
        <div className="overflow-y-auto max-h-28 space-y-2">
          {dates.map((d) => (
            <button
              key={d.format("YYYY-MM-DD")}
              onClick={() => setSelectedDate(d)}
              disabled={loading}
              className={`block w-full rounded p-2 text-center transition-colors ${
                d.isSame(selectedDate, "date") 
                  ? "bg-blue-500 text-white" 
                  : "bg-white border hover:bg-gray-50"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {d.format("DD MMMM, ddd")}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Загрузка...</p>
        </div>
      )}

      {!loading && slots.length > 0 && (
        <div>
          <p className="text-center font-medium mb-2">Выберите время</p>
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`rounded p-2 text-center text-sm transition-colors ${
                  slot === selectedSlot 
                    ? "bg-blue-600 text-white" 
                    : "bg-white border hover:bg-gray-50"
                }`}
              >
                {dayjs(slot).format("HH:mm")}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && slots.length === 0 && !error && (
        <p className="text-center text-gray-500">Нет доступных слотов на выбранную дату</p>
      )}

      <button
        onClick={bookSlot}
        disabled={!selectedSlot || loading}
        className={`w-full rounded py-2 font-medium mt-4 transition-colors ${
          !selectedSlot || loading
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {loading ? "Записываем..." : "Записаться"}
      </button>
    </div>
  );
};

export default App;
