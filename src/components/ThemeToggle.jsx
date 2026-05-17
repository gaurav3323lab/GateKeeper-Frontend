import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`fixed bottom-24 left-4 md:bottom-8 md:left-8 z-50 flex items-center justify-center w-12 h-12 rounded-full shadow-2xl border transition-all duration-500 ease-in-out hover:scale-110 active:scale-95
        ${isDark
          ? 'bg-slate-800/80 border-slate-600 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]'
          : 'bg-white/80 border-gray-200 text-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
        } backdrop-blur-md`}
      title="Toggle Theme"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

export default ThemeToggle;
