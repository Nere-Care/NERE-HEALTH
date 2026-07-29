import { ShieldAlert, ChevronRight } from 'lucide-react';

export default function NotificationBanner({ notifCount, notifVisible, onClose, onClick, darkMode }) {
  if (!notifVisible || !notifCount || notifCount <= 0) return null;

  return (
    <div onClick={onClick}
      className={`mb-6 p-4 rounded-2xl border-l-4 border-orange-500 shadow-sm flex items-center justify-between cursor-pointer hover:opacity-90 transition-all ${darkMode ? "bg-gray-800" : "bg-orange-50"}`}>
      <div className="flex items-center gap-3 flex-1">
        <ShieldAlert className="text-orange-500 flex-shrink-0" size={20} />
        <div>
          <div className="flex items-center gap-2">
            <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Notifications importantes</p>
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{notifCount}</span>
          </div>
          <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Vous avez {notifCount} notification{notifCount > 1 ? 's' : ''} non lue{notifCount > 1 ? 's' : ''}.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <ChevronRight size={16} className="text-orange-500" />
        <button onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="text-orange-500 hover:text-red-500 text-lg font-bold px-2">✕</button>
      </div>
    </div>
  );
}
