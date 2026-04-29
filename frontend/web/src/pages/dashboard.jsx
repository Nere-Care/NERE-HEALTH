import { useLanguage } from '../LanguageContext';
import { Calendar, MessageSquare, FileText, Pill, Video, Clock, Star, ChevronRight } from 'lucide-react';

const specialites = [
  { icon: "❤️", nom: "Cardiologue", nomEn: "Cardiologist" },
  { icon: "🦷", nom: "Dentiste", nomEn: "Dentist" },
  { icon: "🧠", nom: "Neurologue", nomEn: "Neurologist" },
  { icon: "👁️", nom: "Ophtalmologue", nomEn: "Ophthalmologist" },
  { icon: "🦴", nom: "Orthopédiste", nomEn: "Orthopedist" },
  { icon: "🧬", nom: "Généraliste", nomEn: "General Practitioner" },
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
  const { langue } = useLanguage();

  const stats = [
    {
      label: langue === 'fr' ? "Rendez-vous à venir" : "Upcoming Appointments",
      value: "04",
      sub: langue === 'fr' ? "Prochain : 10 Jan" : "Next: Jan 10",
      icon: Calendar,
      color: "bg-blue-100 text-blue-500"
    },
    {
      label: langue === 'fr' ? "Consultations ce mois" : "Consultations This Month",
      value: "12",
      sub: langue === 'fr' ? "+12% depuis le mois dernier" : "+12% from last month",
      icon: Video,
      color: "bg-orange-100 text-orange-500"
    },
    {
      label: langue === 'fr' ? "Messages non lus" : "Unread Messages",
      value: "03",
      sub: langue === 'fr' ? "De 2 médecins" : "From 2 doctors",
      icon: MessageSquare,
      color: "bg-purple-100 text-purple-500"
    },
    {
      label: langue === 'fr' ? "Prescriptions actives" : "Active Prescriptions",
      value: "05",
      sub: langue === 'fr' ? "2 à renouveler" : "2 need refill",
      icon: Pill,
      color: "bg-green-100 text-green-500"
    },
  ];

  return (
    <div className="p-3 md:p-6">

      {/* Bienvenue */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
          {langue === 'fr' ? "Bienvenue, Mle Agine 👋" : "Welcome back, Mle Agine 👋"}
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {langue === 'fr'
            ? "Voici un aperçu de votre santé et vos prochains rendez-vous."
            : "Here's an overview of your health and upcoming appointments."}
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

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Colonne gauche */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Prochain rendez-vous */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-semibold">
                {langue === 'fr' ? "À VENIR" : "UPCOMING"}
              </span>
              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {langue === 'fr' ? "Téléconsultation" : "Video Consultation"}
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
                    {langue === 'fr' ? "Dentiste • Contrôle annuel" : "Dentist • Annual Checkup"}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar size={12} />
                      {langue === 'fr' ? "Aujourd'hui, 31 Déc" : "Today, Dec 31"}
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
                  {langue === 'fr' ? "Rejoindre" : "Join Call"}
                </button>
                <button className={`px-4 py-2 rounded-xl text-sm border
                  ${darkMode ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600"}`}>
                  {langue === 'fr' ? "Reporter" : "Reschedule"}
                </button>
              </div>
            </div>
          </div>

          {/* Spécialités */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                {langue === 'fr' ? "Explorer les spécialités" : "Explore Departments"}
              </h2>
              <button className="text-xs text-blue-500 hover:underline">
                {langue === 'fr' ? "Voir tout" : "View All"}
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {specialites.map((spec, index) => (
                <div key={index} className={`flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer hover:bg-blue-50 transition-all
                  ${darkMode ? "hover:bg-gray-700" : ""}`}>
                  <span className="text-2xl">{spec.icon}</span>
                  <p className={`text-xs text-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {langue === 'fr' ? spec.nom : spec.nomEn}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Consultations récentes */}
          <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                {langue === 'fr' ? "Consultations récentes" : "Recent Consultations"}
              </h2>
              <button className="text-xs text-blue-500 hover:underline">
                {langue === 'fr' ? "Voir tout" : "View All"}
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className={`${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <tr>
                  {[
                    langue === 'fr' ? "Médecin" : "Doctor",
                    langue === 'fr' ? "Type" : "Type",
                    langue === 'fr' ? "Date" : "Date",
                    langue === 'fr' ? "Statut" : "Status",
                    langue === 'fr' ? "Action" : "Action"
                  ].map((h) => (
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
                    <td className={`px-5 py-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{c.type}</td>
                    <td className={`px-5 py-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{c.date}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold
                        ${c.statut === "Terminé"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-500"}`}>
                        {langue === 'fr'
                          ? c.statut
                          : c.statut === "Terminé" ? "Completed" : "Cancelled"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                        <FileText size={12} />
                        {langue === 'fr' ? "Voir" : "View"}
                      </button>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                {langue === 'fr' ? "Résumé santé" : "Health Summary"}
              </h2>
              <p className="text-xs text-gray-400">
                {langue === 'fr' ? "Mis à jour il y a 2 jours" : "Last update: 2 days ago"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: langue === 'fr' ? "Tension" : "Blood Pressure", value: "120/80", unit: "mmHg", statut: langue === 'fr' ? "Normal" : "Normal", color: "text-green-500" },
                { label: langue === 'fr' ? "Rythme cardiaque" : "Heart Rate", value: "62", unit: "bpm", statut: langue === 'fr' ? "Faible" : "Low", color: "text-blue-500" },
                { label: langue === 'fr' ? "Glycémie" : "Blood Sugar", value: "129", unit: "mg/dL", statut: langue === 'fr' ? "Élevé" : "High", color: "text-red-500" },
                { label: langue === 'fr' ? "Poids" : "Weight", value: "165", unit: "lbs", statut: langue === 'fr' ? "Normal" : "Normal", color: "text-green-500" },
              ].map((item, index) => (
                <div key={index} className={`p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <p className={`text-xs mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{item.label}</p>
                  <p className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                    {item.value} <span className="text-xs font-normal text-gray-400">{item.unit}</span>
                  </p>
                  <p className={`text-xs font-semibold ${item.color}`}>{item.statut}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Médecins populaires */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                {langue === 'fr' ? "Médecins populaires" : "Popular Doctors"}
              </h2>
              <button className="text-xs text-blue-500 hover:underline">
                {langue === 'fr' ? "Explorer" : "Explore more"}
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {medecinsPop.map((med, index) => (
                <div key={index} className={`flex items-center gap-3 p-3 rounded-xl
                  ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"} cursor-pointer transition-all`}>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                    {med.nom.charAt(3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {med.nom}
                    </p>
                    <p className="text-xs text-gray-400">{med.specialite}</p>
                    <div className="flex items-center gap-1 text-xs text-yellow-400">
                      <Star size={10} fill="currentColor" />
                      {med.note}
                      <span className="text-gray-400">({med.avis} {langue === 'fr' ? "avis" : "reviews"})</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}