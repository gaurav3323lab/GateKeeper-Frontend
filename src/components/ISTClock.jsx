import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getISTTime } from '../utils/time';

/**
 * Live IST Clock — updates every second
 * Usage: <ISTClock />  or  <ISTClock showDate />
 */
const ISTClock = ({ showDate = false, className = '' }) => {
  const [time, setTime] = useState(getISTTime(showDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getISTTime(showDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [showDate]);

  return (
    <span className={`flex items-center gap-1 font-mono text-xs ${className}`}>
      <Clock size={11} />
      {time}
    </span>
  );
};

export default ISTClock;
