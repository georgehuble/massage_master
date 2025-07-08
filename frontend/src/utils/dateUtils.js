import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/ru";

// Configure dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('ru');

export const formatDateTime = (date) => dayjs(date).format("DD.MM.YYYY HH:mm");
export const formatTime = (date) => dayjs(date).format("HH:mm");

export const generateAvailableDates = (maxDaysAhead, minHoursAhead) => {
  const list = [];
  const now = dayjs();
  for (let i = 0; i < maxDaysAhead; i++) {
    const d = now.add(i, "day");
    if (d.isAfter(now.add(minHoursAhead, "hour"))) {
      list.push(d);
    }
  }
  return list;
};

export const isFutureDate = (date) => new Date(date) > new Date(); 