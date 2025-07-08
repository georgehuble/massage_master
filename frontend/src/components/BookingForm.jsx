import DatePickerIOS from "./DatePickerIOS";
import dayjs from "dayjs";

export default function BookingForm({ 
  selectedDate, 
  setSelectedDate, 
  slots, 
  selectedSlot, 
  setSelectedSlot,
  onSubmit,
  isBlocked,
  countdown
}) {
  // Безопасная проверка selectedDate
  const safeSelectedDate = selectedDate && dayjs.isDayjs(selectedDate) ? selectedDate : dayjs();
  
  return (
    <>
      <DatePickerIOS
        value={safeSelectedDate.toDate()}
        onChange={(d) => {
          if (d && setSelectedDate) {
            setSelectedDate(dayjs(d));
          }
        }}
      />

      {slots && slots.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {slots.map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedSlot && setSelectedSlot(slot)}
              className={`rounded p-2 ${
                slot === selectedSlot ? "bg-blue-600 text-white" : "bg-white border"
              }`}
            >
              {dayjs(slot).format("HH:mm")}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={isBlocked || !selectedSlot}
        className="w-full bg-green-600 text-white py-2 rounded mt-4 disabled:opacity-50"
      >
        {isBlocked ? `Доступно через ${countdown} сек` : "Записаться"}
      </button>
    </>
  );
}
