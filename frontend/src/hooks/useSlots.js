import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

export default function useSlots(selectedDate, API_BASE) {
  return useQuery({
    queryKey: ["slots", selectedDate ? selectedDate.format("YYYY-MM-DD") : "no-date"],
    queryFn: async () => {
      if (!selectedDate || !dayjs.isDayjs(selectedDate)) {
        throw new Error("Некорректная дата");
      }
      
      const res = await fetch(`${API_BASE}/slots?day=${selectedDate.format("YYYY-MM-DD")}`);
      if (!res.ok) throw new Error("Ошибка загрузки слотов");
      return res.json();
    },
    enabled: !!selectedDate && !!API_BASE && dayjs.isDayjs(selectedDate),
  });
}
