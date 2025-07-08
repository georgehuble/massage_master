import React from 'react';

const LoadingSkeleton = ({ type = 'slots' }) => {
  if (type === 'slots') {
    return (
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="text-center space-y-2">
          <div className="h-6 bg-gray-200 rounded-lg w-32 mx-auto animate-pulse"></div>
          <div className="h-4 bg-gray-100 rounded w-48 mx-auto animate-pulse"></div>
        </div>

        {/* Утро */}
        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" style={{
                animationDelay: `${i * 0.1}s`
              }}></div>
            ))}
          </div>
        </div>

        {/* День */}
        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded w-12 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" style={{
                animationDelay: `${(i + 6) * 0.1}s`
              }}></div>
            ))}
          </div>
        </div>

        {/* Вечер */}
        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded w-14 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" style={{
                animationDelay: `${(i + 15) * 0.1}s`
              }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'massageTypes') {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded-lg w-48 mx-auto animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-200 animate-pulse" style={{
              animationDelay: `${i * 0.2}s`
            }}>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-100 rounded w-48"></div>
                  <div className="h-3 bg-gray-100 rounded w-16"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'adminStats') {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-gray-200 animate-pulse" style={{
            animationDelay: `${i * 0.1}s`
          }}>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-16"></div>
                <div className="h-8 bg-gray-300 rounded w-12"></div>
                <div className="h-3 bg-gray-300 rounded w-20"></div>
              </div>
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'adminBookings') {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse" style={{
            animationDelay: `${i * 0.1}s`
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-100 rounded w-32"></div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-3 bg-gray-100 rounded w-16"></div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="h-3 bg-gray-100 rounded w-28"></div>
                <div className="h-3 bg-gray-100 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Базовый загрузчик
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" style={{
          animationDelay: `${i * 0.2}s`
        }}></div>
      ))}
    </div>
  );
};

export default LoadingSkeleton; 