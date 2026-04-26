import { Bell, Sun, Moon } from 'lucide-react';

export default function Header({ titre, darkMode, setDarkMode }) {
  return (
    <div className="fixed top-0 left-56 right-0 z-40 flex items-center justify-between px-6 py-4 bg-white shadow-sm">
      
      {/* Titre */}
      <h1 className="text-xl font-bold text-gray-800">{titre}</h1>

      {/* Droite */}
      <div className="flex items-center gap-4">

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
          <Bell size={22} className="text-gray-600" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            3
          </span>
        </div>

        {/* Profil */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600 text-sm font-bold">M</span>
          </div>
          <span className="text-sm font-medium text-gray-700">Mle agine</span>
        </div>

      </div>
    </div>
  );
}