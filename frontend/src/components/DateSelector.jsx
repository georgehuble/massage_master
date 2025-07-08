import dayjs from "dayjs";

export default function DateSelector({ selectedDate, setSelectedDate, onDateChange }) {
  const now = dayjs();
  const dates = Array.from({ length: 14 }, (_, i) => now.add(i, "day"));

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">Выберите дату:</h3>
      <div className="grid grid-cols-4 gap-2">
        {dates.map((date) => (
          <button
            key={date.format("YYYY-MM-DD")}
            className={`p-2 rounded ${
              date.isSame(selectedDate, "day") ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
            onClick={() => {
              setSelectedDate(date);
              onDateChange(date);
            }}
          >
            {date.format("DD.MM")}
          </button>
        ))}
      </div>
    </div>
  );
}
