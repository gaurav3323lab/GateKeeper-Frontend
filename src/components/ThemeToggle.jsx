import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm border transition-all duration-300
        ${isDark
          ? 'bg-slate-700 border-slate-600 text-yellow-300 hover:bg-slate-600'
          : 'bg-yellow-100 border-yellow-300 text-slate-700 hover:bg-yellow-200'
        }`}
      title="Toggle Theme"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {isDark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
};

export default ThemeToggle;
