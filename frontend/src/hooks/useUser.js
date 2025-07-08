import { useState, useEffect } from 'react';
import { ADMIN_ID, DEFAULT_USER_NAME } from '../constants';

export const useUser = (tg) => {
  const [name, setName] = useState(DEFAULT_USER_NAME);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!tg) return;

    try {
      tg.ready();
      
      const userData = tg.initDataUnsafe;
      const user = userData?.user;
      
      if (user) {
        let displayName = DEFAULT_USER_NAME;
        if (user.first_name || user.last_name || user.username) {
          displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || 
                        `@${user.username}` || 
                        `user${user.id}`;
        }

        setName(displayName);
        localStorage.setItem("userName", displayName);

        if (String(user.id) === ADMIN_ID) {
          setIsAdmin(true);
        }
      } else {
        // Try to restore name from localStorage
        const cachedName = localStorage.getItem("userName");
        if (cachedName) {
          setName(cachedName);
        }
      }

      tg.expand?.();
    } catch (error) {
      console.error("Ошибка инициализации Telegram WebApp:", error);
    }
  }, [tg]);

  return { name, isAdmin };
}; 