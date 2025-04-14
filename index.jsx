import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

export default function BookingApp() {
  const tg = window.Telegram.WebApp;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    tg.expand();
    fetchSlots(selectedDate);
  }, [selectedDate]);

  const fetchSlots = async (date) => {
    const day = format(date, "yyyy-MM-dd");
    const res = await fetch(`https://your-backend.com/api/slots?day=${day}`);
    const data = await res.json();
    setAvailableSlots(data);
  };

  const handleSubmit = () => {
    if (selectedSlot) {
      tg.sendData(selectedSlot);
    }
  };

  return (
    <div className="p-4 text-center">
      <h1 className="text-xl font-bold mb-4">Выберите дату</h1>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        className="mx-auto mb-4"
      />

      <h2 className="text-lg font-semibold mb-2">Свободное время</h2>
      <div className="grid grid-cols-3 gap-2 justify-center">
        {availableSlots.map((slot) => (
          <Button
            key={slot}
            variant={selectedSlot === slot ? "default" : "outline"}
            onClick={() => setSelectedSlot(slot)}
          >
            {format(new Date(slot), "HH:mm")}
          </Button>
        ))}
      </div>

      <div className="mt-6">
        <Button onClick={handleSubmit} disabled={!selectedSlot} className="w-full">
          Записаться
        </Button>
      </div>
    </div>
  );
}
