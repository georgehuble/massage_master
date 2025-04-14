import { useEffect, useState } from "react";
import { format } from "date-fns";

export default function BookingApp() {
  const [error, setError] = useState(null);
  const [tg, setTg] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.Telegram && window.Telegram.WebApp) {
        const tgInstance = window.Telegram.WebApp;
        setTg(tgInstance);
        tgInstance.expand();
        clearInterval(interval);

        updateSlots(new Date());
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const updateSlots = (date) => {
    const now = new Date();
    const slots = [];
    for (let h = 10; h <= 20; h++) {
      const slot = new Date(date);
      slot.setHours(h, 0, 0, 0);
      if (slot > now && slot < new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)) {
        slots.push(slot.toISOString());
      }
    }
    setAvailableSlots(slots);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    updateSlots(date);
    setSelectedSlot(null);
  };

  const handleSubmit = () => {
    if (tg && selectedSlot) {
      tg.sendData(selectedSlot);
    }
  };

  const theme = tg?.themeParams || {};
  const bgColor = theme.bg_color || "#ffffff";
  const buttonColor = theme.button_color || "#3390ec";
  const textColor = theme.text_color || "#222";

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  const renderButton = (value, isSelected, onClick) => (
    <button
      className={`rounded-md px-3 py-2 border transition-all duration-100 ${
        isSelected
          ? "font-semibold scale-105 border-transparent"
          : "border-gray-300"
      }`}
      style={{
        backgroundColor: isSelected ? buttonColor : "transparent",
        color: isSelected ? "#fff" : textColor,
      }}
      onClick={onClick}
    >
      {value}
    </button>
  );

  const upcomingDays = Array.from({ length: 14 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() + i);
    return day;
  });

  return (
    <div className="p-4 min-h-screen text-center" style={{ backgroundColor: bgColor, color: textColor }}>
      <h1 className="text-xl font-bold mb-4">Выберите дату</h1>
      <div className="grid grid-cols-4 gap-2 justify-center mb-6">
        {upcomingDays.map((day) => (
          <div key={day.toDateString()}>
            {renderButton(
              format(day, "dd.MM"),
              selectedDate.toDateString() === day.toDateString(),
              () => handleDateSelect(day)
            )}
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-3">Свободное время</h2>
      <div className="grid grid-cols-3 gap-2 justify-center mb-6">
        {availableSlots.map((slot) => {
          const label = format(new Date(slot), "HH:mm");
          return (
            <div key={slot}>
              {renderButton(label, selectedSlot === slot, () => setSelectedSlot(slot))}
            </div>
          );
        })}
      </div>

      <button
        className="w-full rounded-lg py-2 font-medium"
        style={{
          backgroundColor: selectedSlot ? buttonColor : "#ccc",
          color: selectedSlot ? "#fff" : "#666",
        }}
        onClick={handleSubmit}
        disabled={!selectedSlot}
      >
        Записаться
      </button>
    </div>
  );
}
