import { Bell, FileText, Calendar, CreditCard, FlaskConical, Clock } from 'lucide-react';

const notifications = [
  {
    id: 1,
    message: "Rappel de votre rendez-vous de téléconsultation",
    temps: "Il y a 5 min",
    lu: false,
    icon: Calendar,
    couleur: "bg-blue-100 text-blue-500"
  },
  {
    id: 2,
    message: "Vos résultats d'examen sont disponibles",
    temps: "Il y a 30 min",
    lu: false,
    icon: FlaskConical,
    couleur: "bg-green-100 text-green-500"
  },
  {
    id: 3,
    message: "Votre paiement a été effectué avec succès",
    temps: "Il y a 1 heure",
    lu: false,
    icon: CreditCard,
    couleur: "bg-purple-100 text-purple-500"
  },
  {
    id: 4,
    message: "Rappel de votre rendez-vous de téléconsultation",
    temps: "Il y a 2 heures",
    lu: true,
    icon: Calendar,
    couleur: "bg-blue-100 text-blue-500"
  },
  {
    id: 5,
    message: "Nouveau message de Dr. Ngassa Pierre",
    temps: "Il y a 3 heures",
    lu: true,
    icon: FileText,
    couleur: "bg-orange-100 text-orange-500"
  },
  {
    id: 6,
    message: "Votre ordonnance est prête à être récupérée",
    temps: "Hier",
    lu: true,
    icon: Clock,
    couleur: "bg-red-100 text-red-500"
  },
];

export default function Notifications() {
  return (
    <div className="p-4">

      {/* Titre */}
      <h1 className="text-lg font-bold text-blue-600 mb-2"></h1>
      <button className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-6">
      </button>

      {/* Résumé */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Bell size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">3</p>
            <p className="text-xs text-gray-500">Non lues</p>
          </div>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="bg-green-100 p-3 rounded-xl">
            <FileText size={20} className="text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">6</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="bg-purple-100 p-3 rounded-xl">
            <Clock size={20} className="text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">2</p>
            <p className="text-xs text-gray-500">Aujourd'hui</p>
          </div>
        </div>
      </div>

      {/* Liste notifications */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-700">Toutes les notifications</h2>
          <button className="text-xs text-blue-500 hover:underline">
            Tout marquer comme lu
          </button>
        </div>

        {notifications.map((notif, index) => {
          const Icon = notif.icon;
          return (
            <div
              key={notif.id}
              className={`flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-all
                ${index !== notifications.length - 1 ? "border-b border-gray-50" : ""}
                ${!notif.lu ? "bg-blue-50/30" : "bg-white"}
              `}
            >
              {/* Icône */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.couleur}`}>
                <Icon size={18} />
              </div>

              {/* Message */}
              <div className="flex-1">
                <p className={`text-sm ${!notif.lu ? "font-semibold text-gray-800" : "text-gray-500"}`}>
                  {notif.message}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{notif.temps}</p>
              </div>

              {/* Point non lu */}
              <div className="flex items-center gap-2">
                {!notif.lu && (
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}