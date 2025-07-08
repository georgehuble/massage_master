import { useEffect, useState } from "react";

export default function useTelegram() {
  const [user, setUser] = useState(null);
  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (!tg) return;

    tg.ready();
    const tgUser = tg.initDataUnsafe?.user;
    if (tgUser) {
      setUser(tgUser);
    }
    tg.expand?.();
  }, []);

  return { tg, user };
}