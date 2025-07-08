import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { API_ENDPOINTS, BOOKING_COOLDOWN, DEFAULT_USER_NAME } from '../constants';

export const useBooking = (tg, userName, refetchSlots) => {
  const [confirmedBookings, setConfirmedBookings] = useState(() => 
    JSON.parse(localStorage.getItem("confirmedBookings") || "[]")
  );
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [isLoadingUI, setIsLoadingUI] = useState(false);

  useEffect(() => {
    const last = localStorage.getItem("lastBookingTime");
    if (last) {
      const elapsed = Date.now() - parseInt(last, 10);
      if (elapsed < BOOKING_COOLDOWN) {
        setIsBlocked(true);
        setCountdown(Math.ceil((BOOKING_COOLDOWN - elapsed) / 1000));

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

  const bookSlot = async () => {
    if (!selectedSlot || isBlocked) return;
    setIsLoadingUI(true);

    let userNameForBooking = userName;
    const user = tg?.initDataUnsafe?.user;
    if (userNameForBooking === DEFAULT_USER_NAME && user) {
      userNameForBooking = user.first_name + (user.last_name ? ` ${user.last_name}` : "") || `@${user.username}`;
    }

    try {
      const res = await fetch(API_ENDPOINTS.BOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userNameForBooking, slot: selectedSlot }),
      });

      const data = await res.json();

      if (data.success) {
        const updated = [...confirmedBookings, selectedSlot];
        setConfirmedBookings(updated);
        localStorage.setItem("confirmedBookings", JSON.stringify(updated));
        localStorage.setItem("name", userNameForBooking);
        localStorage.setItem("lastBookingTime", Date.now().toString());

        if (tg?.sendData) {
          try {
            const dataToSend = JSON.stringify({ slot: selectedSlot, name: userNameForBooking });
            tg.sendData(dataToSend);
          } catch (err) {
            console.error("Ошибка отправки данных в Telegram:", err);
          }
        }
        
        toast.success("Вы успешно записаны!");
        setIsBlocked(true);
        setCountdown(15);

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
        await refetchSlots();
      } else {
        toast.error("Ошибка: " + (data.detail || "Не удалось"));
      }
    } catch (error) {
      toast.error("Ошибка соединения: " + error.message);
    } finally {
      setIsLoadingUI(false);
    }
  };

  const cancelBooking = async () => {
    setIsLoadingUI(true);
    try {
      const response = await fetch(API_ENDPOINTS.CANCEL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName, slot: selectedSlot })
      });

      if (response.ok) {
        const updated = confirmedBookings.filter(
          d => new Date(d).getTime() !== new Date(selectedSlot).getTime()
        );
        setConfirmedBookings(updated);
        toast.success("Запись успешно отменена!");
        localStorage.setItem("confirmedBookings", JSON.stringify(updated));
        await refetchSlots();
      } else {
        const errorData = await response.json();
        toast.error("Не удалось отменить запись. Попробуйте позже.");
      }
    } catch (error) {
      toast.error("Ошибка соединения. Попробуйте позже.");
    } finally {
      setIsLoadingUI(false);
    }
  };

  const clearBookings = () => {
    setConfirmedBookings([]);
    localStorage.removeItem("confirmedBookings");
  };

  return {
    confirmedBookings,
    selectedSlot,
    setSelectedSlot,
    isBlocked,
    countdown,
    isLoadingUI,
    bookSlot,
    cancelBooking,
    clearBookings
  };
}; 