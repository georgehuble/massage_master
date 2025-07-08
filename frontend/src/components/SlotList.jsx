import dayjs from "dayjs";

export default function SlotList({ slots, selectedSlot, setSelectedSlot }) {
  if (!slots.length) return <p className="text-gray-500 text-center">Нет доступных слотов</p>;

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">Выберите время:</h3>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => (
          <button
            key={slot}
            onClick={() => setSelectedSlot(slot)}
            className={`p-2 rounded text-sm ${
              selectedSlot === slot ? "bg-green-600 text-white" : "bg-white border"
            }`}
          >
            {dayjs(slot).format("HH:mm")}
          </button>
        ))}
      </div>
    </div>
  );
}
