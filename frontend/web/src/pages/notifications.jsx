import { Bell, FileText, Calendar, CreditCard, FlaskConical, Clock } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const notifications = [
  { id: 1, message: "Rappel de votre rendez-vous de téléconsultation", temps: "Il y a 5 min", lu: false, icon: Calendar, couleur: "bg-blue-100 text-blue-500" },
  { id: 2, message: "Vos résultats d'examen sont disponibles", temps: "Il y a 30 min", lu: false, icon: FlaskConical, couleur: "bg-green-100 text-green-500" },
  { id: 3, message: "Votre paiement a été effectué avec succès", temps: "Il y a 1 heure", lu: false, icon: CreditCard, couleur: "bg-purple-100 text-purple-500" },
  { id: 4, message: "Rappel de votre rendez-vous de téléconsultation", temps: "Il y a 2 heures", lu: true, icon: Calendar, couleur: "bg-blue-100 text-blue-500" },
  { id: 5, message: "Nouveau message de Dr. Ngassa Pierre", temps: "Il y a 3 heures", lu: true, icon: FileText, couleur: "bg-orange-100 text-orange-500" },
  { id: 6, message: "Votre ordonnance est prête à être récupérée", temps: "Hier", lu: true, icon: Clock, couleur: "bg-red-100 text-red-500" },
];

export default function Notifications({ darkMode }) {
  const { t } = useLanguage();

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      <h1 className="text-lg font-bold text-blue-600 mb-2">{/*t.notifications*/}</h1>
      <button className={`flex items-center gap-1 text-sm font-semibold mb-6
        ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
      </button>

      {/* Résumé */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${darkMode ? "bg-blue-900" : "bg-blue-50"}`}>
          <div className="bg-blue-100 p-3 rounded-xl">
            <Bell size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">3</p>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t.nonLues}</p>
          </div>
        </div>
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${darkMode ? "bg-green-900" : "bg-green-50"}`}>
          <div className="bg-green-100 p-3 rounded-xl">
            <FileText size={20} className="text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">6</p>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t.total}</p>
          </div>
        </div>
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${darkMode ? "bg-purple-900" : "bg-purple-50"}`}>
          <div className="bg-purple-100 p-3 rounded-xl">
            <Clock size={20} className="text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">2</p>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t.aujourdhui}</p>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b
          ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <h2 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            {t.toutesNotifs}
          </h2>
          <button className="text-xs text-blue-500 hover:underline">{t.toutMarquer}</button>
        </div>

        {notifications.map((notif, index) => {
          const Icon = notif.icon;
          return (
            <div key={notif.id}
              className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all
                ${index !== notifications.length - 1
                  ? darkMode ? "border-b border-gray-700" : "border-b border-gray-50"
                  : ""}
                ${!notif.lu
                  ? darkMode ? "bg-blue-900/20" : "bg-blue-50/30"
                  : darkMode ? "bg-gray-800" : "bg-white"}
                ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.couleur}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <p className={`text-sm ${!notif.lu
                  ? darkMode ? "font-semibold text-white" : "font-semibold text-gray-800"
                  : darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {notif.message}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{notif.temps}</p>
              </div>
              {!notif.lu && <div className="w-2 h-2 rounded-full bg-red-500" />}
            </div>
          );
        })}
      </div>

    </div>
  );
}