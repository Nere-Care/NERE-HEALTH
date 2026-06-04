import {
  ArrowLeft,
  Calendar,
  CreditCard,
  FlaskConical,
  FileText,
  Clock,
  Bell,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";

// 🔹 Notifications simulées
const notifications = [
  {
    id: 1,
    titre: "Rendez-vous de téléconsultation",
    message:
      "Votre rendez-vous de téléconsultation avec Dr. Ngassa Pierre est prévu aujourd'hui à 14h00.",
    temps: "Il y a 5 min",
    date: "10 Juin 2026 • 13:55",
    icon: Calendar,
    couleur: "bg-blue-100 text-blue-500",
  },

  {
    id: 2,
    titre: "Résultats d'examen disponibles",
    message:
      "Vos résultats d'analyses médicales sont maintenant disponibles dans votre dossier patient.",
    temps: "Il y a 30 min",
    date: "10 Juin 2026 • 13:20",
    icon: FlaskConical,
    couleur: "bg-green-100 text-green-500",
  },

  {
    id: 3,
    titre: "Paiement effectué",
    message:
      "Votre paiement de consultation a été effectué avec succès via Mobile Money.",
    temps: "Il y a 1 heure",
    date: "10 Juin 2026 • 12:00",
    icon: CreditCard,
    couleur: "bg-purple-100 text-purple-500",
  },

  {
    id: 4,
    titre: "Rappel consultation",
    message:
      "N'oubliez pas votre consultation prévue demain matin.",
    temps: "Il y a 2 heures",
    date: "10 Juin 2026 • 11:00",
    icon: Calendar,
    couleur: "bg-blue-100 text-blue-500",
  },

  {
    id: 5,
    titre: "Nouveau message",
    message:
      "Dr. Ngassa Pierre vous a envoyé un nouveau message concernant votre traitement.",
    temps: "Il y a 3 heures",
    date: "10 Juin 2026 • 10:10",
    icon: FileText,
    couleur: "bg-orange-100 text-orange-500",
  },

  {
    id: 6,
    titre: "Ordonnance prête",
    message:
      "Votre ordonnance est prête à être récupérée à la pharmacie.",
    temps: "Hier",
    date: "09 Juin 2026 • 18:45",
    icon: Clock,
    couleur: "bg-red-100 text-red-500",
  },
];

export default function DetailNotification({ darkMode }) {
  const navigate = useNavigate();

  const { id } = useParams();

  // 🔹 Trouver la notification
  const notification = notifications.find(
    (notif) => notif.id === parseInt(id)
  );

  // 🔹 Si notification introuvable
  if (!notification) {
    return (
      <div className="p-6">
        Notification introuvable
      </div>
    );
  }

  const Icon = notification.icon;

  return (
    <div
      className={`min-h-screen p-6 ${
        darkMode
          ? "bg-gray-900 text-white"
          : "bg-gray-50 text-gray-800"
      }`}
    >
      {/* 🔹 Bouton retour */}
      <button
        onClick={() => navigate(-1)}
        className={`flex items-center gap-2 mb-6 text-sm font-medium transition-all
          ${
            darkMode
              ? "text-gray-300 hover:text-white"
              : "text-gray-600 hover:text-blue-500"
          }`}
      >
        <ArrowLeft size={18} />
        Retour
      </button>

      {/* 🔹 Carte détail */}
      <div
        className={`rounded-3xl shadow-lg p-6 ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${notification.couleur}`}
          >
            <Icon size={26} />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {notification.titre}
            </h1>

            <p className="text-sm text-gray-400 mt-1">
              {notification.date}
            </p>
          </div>
        </div>

        {/* Contenu */}
        <div
          className={`rounded-2xl p-5 ${
            darkMode ? "bg-gray-700" : "bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Bell size={18} className="text-blue-500" />

            <p className="font-semibold">
              Détails de la notification
            </p>
          </div>

          <p
            className={`leading-relaxed text-sm ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {notification.message}
          </p>
        </div>

        {/* Temps */}
        <div className="mt-5 flex justify-end">
          <span
            className={`text-xs px-3 py-1 rounded-full ${
              darkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-blue-50 text-blue-500"
            }`}
          >
            {notification.temps}
          </span>
        </div>
      </div>
    </div>
  );
}