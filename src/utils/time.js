// IST Time Utility — India Standard Time (UTC+5:30)

/**
 * Returns current IST time as a formatted string
 * @param {boolean} includeDate - Whether to include date
 * @returns {string} - e.g. "10 May 2026, 4:22 PM IST"
 */
export const getISTTime = (includeDate = false) => {
  const now = new Date();
  const options = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  if (includeDate) {
    options.day = '2-digit';
    options.month = 'short';
    options.year = 'numeric';
  }
  return now.toLocaleString('en-IN', options) + ' IST';
};

/**
 * Formats a given Date/timestamp to IST
 * @param {Date|string} date
 * @returns {string} - e.g. "4:22 PM IST"
 */
export const formatToIST = (date, includeDate = false) => {
  const d = new Date(date);
  const options = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  if (includeDate) {
    options.day = '2-digit';
    options.month = 'short';
    options.year = 'numeric';
  }
  return d.toLocaleString('en-IN', options) + ' IST';
};
