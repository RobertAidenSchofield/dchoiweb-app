'use client';

import { useEffect, useState } from 'react';

function getFormattedTimes() {
  const now = new Date();
  const chiFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const tokFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return {
    chicagoTime: chiFormatter.format(now),
    tokyoTime: tokFormatter.format(now),
  };
}

export function useStudioClocks() {
  const [times, setTimes] = useState({
    chicagoTime: '12:00:00',
    tokyoTime: '02:00:00',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimes(getFormattedTimes());
    }, 0);

    const interval = setInterval(() => {
      setTimes(getFormattedTimes());
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return times;
}
