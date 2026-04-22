import { Bell } from 'lucide-react';

export default function Header({ titre }) {
  return (
    <div className="fixed top-0 left-56 right-0 z-40 flex items-center justify-between px-6 py-4 bg-white shadow-sm">
      
      {/* Titre de la page */}
      <h1 className="text-xl font-bold text-gray-800">{titre}</h1>

      {/* Droite : notif + profil */}
      <div className="flex items-center gap-4">
        
        {/* Cloche notification */}
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