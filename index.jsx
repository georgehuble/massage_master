import { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

const ADMIN_ID = import.meta.env.VITE_ADMIN_ID;
const API_BASE = import.meta.env.VITE_API_BASE;
const tg = window.Telegram?.WebApp;

const BookingApp = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs().add(4, "hour"));
  const [allRecords, setAllRecords] = useState([]);

  const fetchSlots = async (date) => {
    const day = date.format("YYYY-MM-DD");
    const res = await fetch(`${API_BASE}/slots?day=${day}`);
    const data = await res.json();
    setSlots(data);
  };

  const fetchAllRecords = async () => {
    const res = await fetch(`${API_BASE}/records`);
    const data = await res.json();
    setAllRecords(data);
  };

  const bookSlot = async () => {
    if (!selectedSlot) return;
    const res = await fetch(`${API_BASE}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: tg?.initDataUnsafe?.user?.first_name || "Гость",
        slot: selectedSlot,
      }),
    });
    const data = await res.json();
    tg.showAlert(data.success ? "Вы записаны!" : "Ошибка при записи");
    fetchSlots(selectedDate);
  };

  useEffect(() => {
    if (tg?.initDataUnsafe?.user?.id == ADMIN_ID) {
      setIsAdmin(true);
      fetchAllRecords();
    } else {
      fetchSlots(selectedDate);
    }
    tg?.expand();
  }, []);

  useEffect(() => {
    const list = [];
    const now = dayjs();
    for (let i = 0; i < 14; i++) {
      const d = now.add(i, "day");
      if (d.isAfter(now.add(4, "hour"))) list.push(d);
    }
    setDates(list);
  }, []);

  useEffect(() => {
    if (!isAdmin) fetchSlots(selectedDate);
  }, [selectedDate]);

  if (isAdmin) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-center text-xl font-bold">Все записи</h2>
        {allRecords.map((r, i) => (
          <div key={i} className="border p-2 rounded">
            {r.name} — {dayjs(r.slot).format("DD.MM.YYYY HH:mm")}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-center text-xl font-bold">Запись на массаж</h2>
      <div>
        <p className="text-center font-medium mb-2">Выберите дату</p>
        <div className="overflow-y-auto max-h-28 space-y-2">
          {dates.map((d, i) => (
            <button
              key={i}
              onClick={() => setSelectedDate(d)}
              className={`block w-full rounded p-2 text-center ${
                d.isSame(selectedDate, "date") ? "bg-blue-500 text-white" : "bg-white border"
              }`}
            >
              {d.format("DD MMMM, ddd")}
            </button>
          ))}
        </div>
      </div>

      {slots.length > 0 && (
        <div>
          <p className="text-center font-medium mb-2">Выберите время</p>
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot, i) => (
              <button
                key={i}
                onClick={() => setSelectedSlot(slot)}
                className={`rounded p-2 text-center text-sm ${
                  slot === selectedSlot ? "bg-blue-600 text-white" : "bg-white border"
                }`}
              >
                {dayjs(slot).format("HH:mm")}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={bookSlot}
        className="w-full rounded bg-green-600 text-white py-2 font-medium mt-4"
      >
        Записаться
      </button>
    </div>
  );
};

export default BookingApp;
