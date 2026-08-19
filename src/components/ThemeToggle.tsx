import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
          theme === 'light' 
            ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
        title="Light Mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
          theme === 'dark' 
            ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
        title="Dark Mode"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
          theme === 'system' 
            ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
        title="System Preference"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ThemeToggle;
