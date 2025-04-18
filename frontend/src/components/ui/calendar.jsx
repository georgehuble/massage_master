import { format } from "date-fns";

export function Calendar({ selected, onSelect }) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  return (
    <div className="grid grid-cols-4 gap-2">
      {days.map((day) => {
        const isSelected = selected.toDateString() === day.toDateString();
        return (
          <button
            key={day.toISOString()}
            className={`rounded px-2 py-1 border \${isSelected ? "bg-blue-600 text-white" : "bg-white text-blue-600"}`}
            onClick={() => onSelect(day)}
          >
            {format(day, "dd.MM")}
          </button>
        );
      })}
    </div>
  );
}
