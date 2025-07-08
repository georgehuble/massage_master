import dayjs from "dayjs";

export default function AdminRecords({ records }) {
  // Безопасная проверка records
  if (!records || !Array.isArray(records)) {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-center mb-4">Все записи</h3>
        <p className="text-gray-500 text-center">Ошибка загрузки записей</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-center mb-4">Все записи</h3>
      {records.length === 0 ? (
        <p className="text-gray-500 text-center">Нет записей</p>
      ) : (
        records.map((r, i) => (
          <div key={`${r.slot}-${r.name}-${i}`} className="border p-2 rounded shadow-sm">
            <p>
              <strong>{r.name}</strong> — {dayjs(r.slot).format("DD.MM.YYYY HH:mm")}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
