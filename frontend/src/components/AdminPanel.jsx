import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import { massageTypes } from './MassageTypeSelector';
import LoadingSkeleton from './LoadingSkeleton';

const AdminPanel = ({ allRecords, onRefresh }) => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'stats'
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Статистика
  const getStats = () => {
    const today = dayjs().startOf('day');
    const thisWeek = dayjs().startOf('week');
    const thisMonth = dayjs().startOf('month');

    const todayBookings = allRecords.filter(r => 
      dayjs(r.slot).isSame(today, 'day')
    );
    
    const weekBookings = allRecords.filter(r => 
      dayjs(r.slot).isAfter(thisWeek) && dayjs(r.slot).isBefore(thisWeek.add(1, 'week'))
    );
    
    const monthBookings = allRecords.filter(r => 
      dayjs(r.slot).isAfter(thisMonth) && dayjs(r.slot).isBefore(thisMonth.add(1, 'month'))
    );

    const totalRevenue = monthBookings.reduce((sum, record) => {
      const type = massageTypes.find(t => t.id === record.massageType);
      return sum + (parseInt(type?.price.replace(/[^\d]/g, '') || 0));
    }, 0);

    return {
      today: todayBookings.length,
      week: weekBookings.length, 
      month: monthBookings.length,
      revenue: totalRevenue
    };
  };

  const stats = getStats();

  // Получить записи для выбранной даты
  const getDayBookings = (date) => {
    return allRecords
      .filter(r => dayjs(r.slot).isSame(date, 'day'))
      .sort((a, b) => dayjs(a.slot).valueOf() - dayjs(b.slot).valueOf());
  };

  // Обновление данных
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`${color} p-4 rounded-xl text-white shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-white/70 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className="text-3xl opacity-80">{icon}</div>
      </div>
    </motion.div>
  );

  const BookingCard = ({ booking, index }) => {
    const massageType = massageTypes.find(t => t.id === booking.massageType) || massageTypes[0];
    const time = dayjs(booking.slot);
    const endTime = time.add(massageType.duration + 20, 'minute'); // +20 мин буфер

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${massageType.color} flex items-center justify-center text-white text-lg`}>
              {massageType.icon}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{booking.name}</h4>
              <p className="text-sm text-gray-600">{massageType.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900">
              {time.format('HH:mm')} - {endTime.format('HH:mm')}
            </p>
            <p className="text-sm text-gray-600">{massageType.price}</p>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Длительность: {massageType.duration} мин</span>
            <span>ID: {booking.name.slice(-4)}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  const dayBookings = getDayBookings(selectedDate);

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Админ-панель</h1>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
        >
          <span className={`${isRefreshing ? 'animate-spin' : ''}`}>🔄</span>
          <span>Обновить</span>
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Сегодня"
          value={stats.today}
          icon="📅"
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          subtitle={`${stats.today} записей`}
        />
        <StatCard
          title="На неделе"
          value={stats.week}
          icon="📊"
          color="bg-gradient-to-r from-green-500 to-green-600"
          subtitle={`${stats.week} записей`}
        />
        <StatCard
          title="В месяце"
          value={stats.month}
          icon="📈"
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          subtitle={`${stats.month} записей`}
        />
        <StatCard
          title="Доход"
          value={`${stats.revenue.toLocaleString()} ₽`}
          icon="💰"
          color="bg-gradient-to-r from-orange-500 to-orange-600"
          subtitle="за месяц"
        />
      </div>

      {/* Навигация по датам */}
      <div className="bg-white rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedDate.format('DD MMMM YYYY')} ({selectedDate.format('dddd')})
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedDate(selectedDate.subtract(1, 'day'))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ◀️
            </button>
            <button
              onClick={() => setSelectedDate(dayjs())}
              className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium"
            >
              Сегодня
            </button>
            <button
              onClick={() => setSelectedDate(selectedDate.add(1, 'day'))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ▶️
            </button>
          </div>
        </div>

        {/* Записи на день */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">
              Записи на день ({dayBookings.length})
            </h3>
            {dayBookings.length > 0 && (
              <span className="text-sm text-gray-500">
                Доход: {dayBookings.reduce((sum, booking) => {
                  const type = massageTypes.find(t => t.id === booking.massageType);
                  return sum + parseInt(type?.price.replace(/[^\d]/g, '') || 0);
                }, 0).toLocaleString()} ₽
              </span>
            )}
          </div>

          <AnimatePresence>
            {dayBookings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-gray-500"
              >
                <div className="text-4xl mb-2">📅</div>
                <p>Нет записей на этот день</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {dayBookings.map((booking, index) => (
                  <BookingCard key={`${booking.slot}-${booking.name}-${index}`} booking={booking} index={index} />
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="bg-white rounded-xl p-4 shadow-md">
        <h3 className="font-medium text-gray-700 mb-3">Быстрые действия</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center space-x-2 p-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
            <span>📊</span>
            <span className="text-sm font-medium">Экспорт данных</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
            <span>📱</span>
            <span className="text-sm font-medium">Уведомления</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 