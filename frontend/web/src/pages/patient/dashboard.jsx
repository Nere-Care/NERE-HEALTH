import { useState, useEffect } from 'react';
import {
  Calendar,
  Pill,
  Video,
  ShieldAlert,
  Zap,
  Megaphone
} from 'lucide-react';

const specialites = [
  { icon: "❤️", nom: "Cardiologue" },
  { icon: "🦷", nom: "Dentiste" },
  { icon: "🧠", nom: "Neurologue" },
  { icon: "👁️", nom: "Ophtalmologue" },
  { icon: "🦴", nom: "Orthopédiste" },
  { icon: "🧬", nom: "Généraliste" }
];

const consultationsRecentes = [
  { id: 1, medecin: "Dr. Ngassa Pierre", type: "Dentisterie", date: "10/03/2026", statut: "Terminé" },
  { id: 2, medecin: "Dr. Kamdem Marie", type: "Cardiologie", date: "05/03/2026", statut: "Terminé" },
  { id: 3, medecin: "Dr. Bello Ahmed", type: "Généraliste", date: "28/02/2026", statut: "Annulé" },
];

const actualites = [
  {
    id: 1,
    titre: "Campagne de vaccination Polio",
    desc: "Du 12 au 15 juin dans tous les centres.",
    color: "bg-red-500"
  },
  {
    id: 2,
    titre: "Alerte Épidémie : Choléra",
    desc: "Mesures d'hygiène renforcées recommandées.",
    color: "bg-orange-500"
  },
];

export default function Dashboard({ darkMode }) {
  const [newsIndex, setNewsIndex] = useState(0);

  // Rotation du carousel d'actualités
  useEffect(() => {
    const timer = setInterval(() => {
      setNewsIndex((prev) => (prev + 1) % actualites.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const stats = [
    {
      label: "Rendez-vous à venir",
      value: "04",
      sub: "Prochain : 10 Jan",
      icon: Calendar,
      color: "bg-blue-100 text-blue-500"
    },
    {
      label: "Consultations ce mois",
      value: "12",
      sub: "+12% depuis le mois dernier",
      icon: Video,
      color: "bg-orange-100 text-orange-500"
    },
    {
      label: "Prescriptions actives",
      value: "05",
      sub: "2 à renouveler",
      icon: Pill,
      color: "bg-green-100 text-green-500"
    },
  ];

  return (
    <div className="p-3 md:p-6">

      {/* Bienvenue & Carousel Actualités */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
            Bienvenue, Mle Agine 👋
          </h1>

          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Voici un aperçu de votre santé.
          </p>
        </div>

        {/* Carousel d'actualités */}
        <div className={`lg:w-80 w-full p-4 rounded-2xl text-white shadow-lg transition-all duration-500 ${actualites[newsIndex].color}`}>
          <div className="flex items-start gap-3">
            <Megaphone size={18} className="mt-1" />

            <div>
              <p className="font-bold text-sm">
                {actualites[newsIndex].titre}
              </p>

              <p className="text-xs opacity-90">
                {actualites[newsIndex].desc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div
              key={index}
              className={`rounded-2xl shadow p-4 flex items-center gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                <Icon size={22} />
              </div>

              <div>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {stat.label}
                </p>

                <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {stat.value}
                </p>

                <p className="text-xs text-green-500">
                  {stat.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notifications importantes */}
      <div className={`mb-6 p-4 rounded-2xl border-l-4 border-orange-500 shadow-sm flex items-center justify-between ${darkMode ? "bg-gray-800" : "bg-orange-50"}`}>
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-orange-500" size={20} />

          <div>
            <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
              Notification importante
            </p>

            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Vos nouveaux résultats d'examens (Laboratoire Central) sont disponibles.
            </p>
          </div>
        </div>

        <button className="text-xs font-bold text-orange-600 underline">
          Voir
        </button>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Colonne gauche */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Prochain rendez-vous */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-semibold">
                À VENIR
              </span>

              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Téléconsultation
              </span>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                  N
                </div>

                <div>
                  <p className={`font-bold text-lg ${darkMode ? "text-white" : "text-gray-800"}`}>
                    Dr. Ngassa Pierre
                  </p>

                  <p className="text-sm text-blue-400">
                    Dentiste • Contrôle annuel
                  </p>
                </div>
              </div>

              <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-600">
                <Video size={16} />
                Rejoindre
              </button>
            </div>
          </div>

          {/* Spécialités */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                Explorer les spécialités
              </h2>

              <button className="text-xs text-blue-500 hover:underline">
                Voir tout
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {specialites.map((spec, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer hover:bg-blue-50 transition-all ${darkMode ? "hover:bg-gray-700" : ""}`}
                >
                  <span className="text-2xl">{spec.icon}</span>

                  <p className={`text-xs text-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {spec.nom}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Consultations récentes */}
          <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                Consultations récentes
              </h2>
            </div>

            <table className="w-full text-sm">
              <thead className={`${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <tr>
                  {["Médecin", "Type", "Date", "Statut"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {consultationsRecentes.map((c, index) => (
                  <tr
                    key={index}
                    className={`border-t ${darkMode ? "border-gray-700" : "border-gray-50"}`}
                  >
                    <td className="px-5 py-3">
                      <button
                        onClick={() => console.log("Aller vers profil medecin", c.id)}
                        className={`font-bold hover:text-blue-500 transition-colors ${darkMode ? "text-white" : "text-gray-800"}`}
                      >
                        {c.medecin}
                      </button>
                    </td>

                    <td className={`px-5 py-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {c.type}
                    </td>

                    <td className={`px-5 py-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {c.date}
                    </td>

                    <td className="px-5 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          c.statut === "Terminé"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-500"
                        }`}
                      >
                        {c.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-6">

          {/* Résumé santé */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
              Résumé santé
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Tension", value: "120/80" },
                { label: "Poids", value: "75 kg" }
              ].map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}
                >
                  <p className="text-xs text-gray-400">
                    {item.label}
                  </p>

                  <p className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Médicaments */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Pill size={18} className="text-green-500" />
              Médicaments
            </h2>

            <div className="flex flex-col gap-3">
              {[
                { nom: "Paracétamol", heure: "08:00 AM" },
                { nom: "Vitamines", heure: "12:30 PM" }
              ].map((m, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0"
                >
                  <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                    {m.nom}
                  </p>

                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg">
                    {m.heure}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mise à jour */}
          <div className={`rounded-2xl shadow p-5 border-t-4 border-blue-500 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`font-bold text-sm mb-2 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Zap size={16} className="text-yellow-500" />
              Mise à jour
            </h2>

            <p className="text-[11px] text-gray-400 mb-3">
              Version 1.2.5 disponible. Amélioration des appels vidéo.
            </p>

            <button className="w-full bg-blue-500 text-white py-2 rounded-xl text-xs font-bold">
              Installer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}