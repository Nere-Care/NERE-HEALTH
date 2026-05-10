import { Bell, Sun, Moon, Globe } from 'lucide-react';
import { useLanguage } from '../../LanguageContext';

export default function HeaderStructure({ darkMode, setDarkMode }) {
  const { langue, setLangue } = useLanguage();

  return (
    <div className={`fixed top-0 left-0 right-0 lg:left-56 z-40 flex items-center justify-between px-6 py-4 shadow-sm
      ${darkMode ? "bg-gray-800" : "bg-white"}`}>

      <h1 className={`text-xl font-bold lg:ml-0 ml-10 ${darkMode ? "text-white" : "text-gray-800"}`}>
    
      </h1>

      <div className="flex items-center gap-4">

        {/* Bouton langue */}
        <button
          onClick={() => setLangue(langue === 'fr' ? 'en' : 'fr')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all
            ${darkMode
              ? "border-gray-600 text-gray-300 hover:bg-gray-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
        >
          <Globe size={14} />
          {langue === 'fr' ? 'EN' : 'FR'}
        </button>

        {/* Bouton jour/nuit */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`w-14 h-7 rounded-full relative transition-all duration-300
            ${darkMode ? "bg-blue-600" : "bg-gray-200"}`}
        >
          <div className={`w-6 h-6 rounded-full absolute top-0.5 flex items-center justify-center transition-all duration-300
            ${darkMode ? "right-0.5 bg-white" : "left-0.5 bg-white"}`}>
            {darkMode
              ? <Moon size={12} className="text-blue-600" />
              : <Sun size={12} className="text-yellow-500" />
            }
          </div>
        </button>

        {/* Cloche */}
        <div className="relative cursor-pointer">
          <Bell size={22} className={darkMode ? "text-gray-300" : "text-gray-600"} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            5
          </span>
        </div>

        {/* Profil structure */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">H</span>
          </div>
          <div className="hidden md:block">
            <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
              Hôpital Général
            </p>
            <p className="text-xs text-gray-400">Administrateur</p>
          </div>
        </div>

      </div>
    </div>
  );
}