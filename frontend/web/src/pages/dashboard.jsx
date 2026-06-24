import { useState } from 'react';
import { Calendar, MessageSquare, FileText, Pill, Video, Clock, Star, ChevronRight } from 'lucide-react';

const specialites = [
  { icon: "", nom: "Cardiologue" },
  { icon: "", nom: "Dentiste" },
  { icon: "", nom: "Neurologue" },
  { icon: "", nom: "Ophtalmologue" },
  { icon: "", nom: "Orthopédiste" },
  { icon: "", nom: "Généraliste" },
];

const consultationsRecentes = [
  { medecin: "Dr. Ngassa Pierre", type: "Dentisterie", date: "10/03/2026", statut: "Terminé" },
  { medecin: "Dr. Kamdem Marie", type: "Cardiologie", date: "05/03/2026", statut: "Terminé" },
  { medecin: "Dr. Bello Ahmed", type: "Généraliste", date: "28/02/2026", statut: "Annulé" },
];

const medecinsPop = [
  { nom: "Dr. Ngassa Pierre", specialite: "Dentiste", note: 4.9, avis: 270 },
  { nom: "Dr. Kamdem Marie", specialite: "Cardiologue", note: 4.8, avis: 150 },
  { nom: "Dr. Bello Ahmed", specialite: "Généraliste", note: 4.7, avis: 130 },
];

export default function Dashboard({ darkMode }) {

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
      label: "Messages non lus",
      value: "03",
      sub: "De 2 médecins",
      icon: MessageSquare,
      color: "bg-purple-100 text-purple-500"
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

      {/* Bienvenue */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
          Bienvenue, Mle Agine 👋
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Voici un aperçu de votre santé et vos prochains rendez-vous.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`rounded-2xl shadow p-4 flex items-center gap-4
              ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{stat.label}</p>
                <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{stat.value}</p>
                <p className="text-xs text-green-500">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

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
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar size={12} />
                      Aujourd'hui, 31 Déc
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={12} />
                      10:00 AM
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-600">
                  <Video size={16} />
                  Rejoindre
                </button>
                <button className={`px-4 py-2 rounded-xl text-sm border
                  ${darkMode ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600"}`}>
                  Reporter
                </button>
              </div>
            </div>
          </div>

          {/* Spécialités */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
              Explorer les spécialités
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {specialites.map((spec, index) => (
                <div key={index} className={`flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer
                  ${darkMode ? "hover:bg-gray-700" : "hover:bg-blue-50"}`}>
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
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                Consultations récentes
              </h2>
            </div>

            <table className="w-full text-sm">
              <thead className={`${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <tr>
                  {["Médecin", "Type", "Date", "Statut", "Action"].map((h) => (
                    <th key={h} className={`text-left px-5 py-3 text-xs font-semibold
                      ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {consultationsRecentes.map((c, index) => (
                  <tr key={index} className={`border-t ${darkMode ? "border-gray-700" : "border-gray-50"}`}>
                    <td className={`px-5 py-3 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {c.medecin}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{c.type}</td>
                    <td className="px-5 py-3 text-gray-500">{c.date}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold
                        ${c.statut === "Terminé"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-500"}`}>
                        {c.statut}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-blue-500">Voir</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-6">

          {/* Médecins populaires */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
              Médecins populaires
            </h2>

            <div className="flex flex-col gap-3">
              {medecinsPop.map((med, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold">
                    {med.nom.charAt(3)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{med.nom}</p>
                    <p className="text-xs text-gray-400">{med.specialite}</p>
                    <p className="text-xs text-yellow-500">⭐ {med.note} ({med.avis})</p>
                  </div>
                  <ChevronRight size={16} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}