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

const ADMIN_ID = import.meta.env.VITE_ADMIN_ID;
const API_BASE = import.meta.env.VITE_API_BASE;
const tg = window.Telegram?.WebApp;

const BookingApp = () => {
  const [confirmedBookings, setConfirmedBookings] = useState(() => {
    const saved = localStorage.getItem("confirmedBookings");
    return saved ? JSON.parse(saved) : [];
  });

  const showConfirmation = confirmedBookings.some(d => new Date(d) > new Date());
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs().add(4, "hour"));
  const [allRecords, setAllRecords] = useState([]);
  const [name, setName] = useState("Гость");
  const [isBlocked, setIsBlocked] = useState(false);

  // Проверка блокировки после последней записи
  useEffect(() => {
    const last = localStorage.getItem("lastBookingTime");
    if (last) {
      const elapsed = Date.now() - parseInt(last, 10);
      if (elapsed < 15 * 1000) {
        setIsBlocked(true);
        setTimeout(() => setIsBlocked(false), 15 * 1000 - elapsed);
      }
    }
  }, []);

  // React Query: загрузка слотов
  const {
    data: slots = [],
    refetch: refetchSlots,
    isLoading: slotsLoading,
    isError: slotsError,
  } = useQuery({
    queryKey: ["slots", selectedDate.format("YYYY-MM-DD")],
    queryFn: async () => {
      const day = selectedDate.format("YYYY-MM-DD");
      const res = await fetch(`${API_BASE}/slots?day=${day}`);
      if (!res.ok) throw new Error("Ошибка загрузки слотов");
      return res.json();
    },
    enabled: !isAdmin && !!selectedDate,
  });

  // Загрузка всех записей (для админа)
  const fetchAllRecords = async () => {
    const res = await fetch(`${API_BASE}/records`);
    const data = await res.json();
    setAllRecords(data);
  };

  const bookSlot = async () => {
    if (!selectedSlot || isBlocked) return;
  
    const res = await fetch(`${API_BASE}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        slot: selectedSlot,
      }),
    });
  
    const data = await res.json();
  
    if (data.success) {
      const updated = [...confirmedBookings, selectedSlot];
      setConfirmedBookings(updated);
      localStorage.setItem("confirmedBookings", JSON.stringify(updated));
  
      localStorage.setItem("name", name); // 👈 Сохраняем имя для отмены
  
      toast.success("Вы успешно записаны!");
      localStorage.setItem("lastBookingTime", Date.now().toString());
      setIsBlocked(true);
      setTimeout(() => setIsBlocked(false), 15 * 1000);
      await refetchSlots();
    } else {
      toast.error("Ошибка: " + (data.detail || "Не удалось"));
    }
  };


  // Получение пользователя и прав
  useEffect(() => {
    const user = tg?.initDataUnsafe?.user;
    if (!user) return;
    
    console.log("tg user", user);
    
    const first = user?.first_name || "";
    const last = user?.last_name || "";
    const username = user?.username;
    const id = user?.id;
    
    const resolvedName =
      username ? `@${username}` :
      first && last ? `${first} ${last}` :
      first ? first :
      id ? `user${id}` :
      "Гость";
    
    setName(resolvedName);
    localStorage.setItem("name", resolvedName);

    if (String(user.id) === ADMIN_ID) {
      setIsAdmin(true);
      fetchAllRecords();
    }

    tg.expand?.();
  }, []);

  // Список доступных дат
  useEffect(() => {
    const list = [];
    const now = dayjs();
    for (let i = 0; i < 14; i++) {
      const d = now.add(i, "day");
      if (d.isAfter(now.add(4, "hour"))) list.push(d);
    }
    setDates(list);
  }, []);

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

  if (showConfirmation) {
    return (
      <div className="p-4">
        <BookingConfirmation
          bookings={confirmedBookings}
          onCancel={async () => {
            const name = localStorage.getItem("name"); // получаем имя пользователя
            const response = await fetch("/api/cancel", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                name,
                slot: selectedSlot
              })
            });

            if (response.ok) {
              const updated = confirmedBookings.filter(
                (d) => new Date(d).getTime() !== new Date(selectedSlot).getTime()
              );
              await refetchSlots();
              setConfirmedBookings(updated);
              toast.success("Запись успешно отменена!");
              localStorage.setItem("confirmedBookings", JSON.stringify(updated));
            } else {
              alert("Не удалось отменить запись. Попробуйте позже.");
            }
          }}
          onRebook={() => {
            setConfirmedBookings([]);
            localStorage.removeItem("confirmedBookings");
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-center text-xl font-bold">Запись на массаж</h2>

      <div className="space-y-2">
        <p className="text-center font-medium">Выберите дату и время</p>
        <DatePickerIOS
          value={selectedDate.toDate()}
          onChange={(d) => {
            const newDate = dayjs(d);
            setSelectedDate(newDate);
            const nearestSlot = slots.find((slot) =>
              dayjs(slot).isSame(newDate, "minute")
            );
            if (nearestSlot) setSelectedSlot(nearestSlot);
          }}
        />
      </div>

      {slotsLoading && <p className="text-center text-gray-500">Загрузка слотов...</p>}
      {slotsError && <p className="text-center text-red-500">Ошибка загрузки слотов</p>}

      {slots.length > 0 && (
        <div>
          <p className="text-center font-medium mb-2">Свободные слоты</p>
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot, i) => (
              <button
                key={i}
                onClick={() => setSelectedSlot(slot)}
                className={`rounded p-2 text-center text-sm ${slot === selectedSlot
                    ? "bg-blue-600 text-white"
                    : "bg-white border"
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
        disabled={isBlocked}
        className="
        w-full rounded bg-green-600 text-white py-2 font-medium mt-4
        hover:bg-green-700
        active:bg-green-800
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
      "
      >
        {isBlocked
          ? "Повторная запись доступна через 15 сек"
          : "Записаться"}
      </button>
    </div>
  );
};

export default BookingApp;
