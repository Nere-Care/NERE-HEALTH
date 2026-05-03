import { useLanguage } from '../../LanguageContext';
import { Users, Calendar, Clock, TrendingUp, CheckCircle, XCircle, AlertCircle, ChevronRight } from 'lucide-react';

const patientsRecents = [
  { id: 1, nom: "Jean Dupont", motif: "Consultation générale", heure: "08:30", statut: "Confirmé" },
  { id: 2, nom: "Marie Kamdem", motif: "Suivi cardiologie", heure: "09:00", statut: "En attente" },
  { id: 3, nom: "Paul Bello", motif: "Analyse sanguine", heure: "09:30", statut: "Confirmé" },
  { id: 4, nom: "Sophie Ngo", motif: "Radiologie", heure: "10:00", statut: "Annulé" },
  { id: 5, nom: "Marc Essomba", motif: "Consultation pédiatrie", heure: "10:30", statut: "Confirmé" },
];

const medecins = [
  { nom: "Dr. Ngassa Pierre", specialite: "Dentiste", patients: 12, disponible: true },
  { nom: "Dr. Kamdem Marie", specialite: "Cardiologue", patients: 8, disponible: true },
  { nom: "Dr. Bello Ahmed", specialite: "Généraliste", patients: 15, disponible: false },
  { nom: "Dr. Ngo Sophie", specialite: "Pédiatre", patients: 10, disponible: true },
];

export default function DashboardStructure({ darkMode }) {
  const { langue } = useLanguage();

  const stats = [
    {
      label: langue === 'fr' ? "Patients aujourd'hui" : "Today's Patients",
      value: "48",
      sub: langue === 'fr' ? "+8% depuis hier" : "+8% from yesterday",
      icon: Users,
      color: "bg-blue-100 text-blue-500",
    },
    {
      label: langue === 'fr' ? "Rendez-vous" : "Appointments",
      value: "24",
      sub: langue === 'fr' ? "12 confirmés" : "12 confirmed",
      icon: Calendar,
      color: "bg-green-100 text-green-500",
    },
    {
      label: langue === 'fr' ? "En attente" : "Waiting",
      value: "06",
      sub: langue === 'fr' ? "Temps moyen: 15 min" : "Average time: 15 min",
      icon: Clock,
      color: "bg-orange-100 text-orange-500",
    },
    {
      value: "87%",
      sub: langue === 'fr' ? "+5% ce mois" : "+5% this month",
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-500",
    },
  ];

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {/* Bienvenue */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
          {langue === 'fr' ? "Tableau de Bord 👋" : "Dashboard 👋"}
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {langue === 'fr'
            ? "Bienvenue ! Voici un aperçu de votre activité aujourd'hui."
            : "Welcome! Here's an overview of your activity today."}
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

          {/* Rendez-vous du jour */}
          <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className={`flex items-center justify-between px-5 py-4 border-b
              ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                {langue === 'fr' ? "Rendez-vous du jour" : "Today's Appointments"}
              </h2>
              <button className="text-xs text-blue-500 hover:underline">
                {langue === 'fr' ? "Voir tout" : "View all"}
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  {[
                    langue === 'fr' ? "Patient" : "Patient",
                    langue === 'fr' ? "Motif" : "Reason",
                    langue === 'fr' ? "Heure" : "Time",
                    langue === 'fr' ? "Statut" : "Status",
                    langue === 'fr' ? "Action" : "Action",
                  ].map((h) => (
                    <th key={h} className={`text-left px-5 py-3 text-xs font-semibold
                      ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patientsRecents.map((p, index) => (
                  <tr key={index} className={`border-t
                    ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-50 hover:bg-gray-50"}`}>
                    <td className={`px-5 py-3 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {p.nom}
                    </td>
                    <td className={`px-5 py-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {p.motif}
                    </td>
                    <td className={`px-5 py-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {p.heure}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 w-fit
                        ${p.statut === "Confirmé"
                          ? "bg-green-100 text-green-600"
                          : p.statut === "En attente"
                            ? "bg-orange-100 text-orange-500"
                            : "bg-red-100 text-red-500"
                        }`}>
                        {p.statut === "Confirmé" && <CheckCircle size={10} />}
                        {p.statut === "En attente" && <AlertCircle size={10} />}
                        {p.statut === "Annulé" && <XCircle size={10} />}
                        {p.statut}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                        {langue === 'fr' ? "Voir" : "View"}
                        <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Graphique activité */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                {langue === 'fr' ? "Activité de la semaine" : "Weekly Activity"}
              </h2>
              <select className={`text-xs border rounded-lg px-2 py-1
                ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300" : "border-gray-200 text-gray-600"}`}>
                <option>{langue === 'fr' ? "Cette semaine" : "This week"}</option>
                <option>{langue === 'fr' ? "Ce mois" : "This month"}</option>
              </select>
            </div>
            {/* Barres simples */}
            <div className="flex items-end gap-3 h-32">
              {[
                { jour: "Lun", valeur: 75 },
                { jour: "Mar", valeur: 90 },
                { jour: "Mer", valeur: 60 },
                { jour: "Jeu", valeur: 85 },
                { jour: "Ven", valeur: 70 },
                { jour: "Sam", valeur: 40 },
                { jour: "Dim", valeur: 20 },
              ].map((item) => (
                <div key={item.jour} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className="w-full rounded-t-lg bg-blue-500 opacity-80 hover:opacity-100 transition-all"
                    style={{ height: `${item.valeur}%` }}
                  />
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{item.jour}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-6">

          {/* Médecins disponibles */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                {langue === 'fr' ? "Médecins" : "Doctors"}
              </h2>
              <button className="text-xs text-blue-500 hover:underline">
                {langue === 'fr' ? "Voir tout" : "View all"}
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {medecins.map((med, index) => (
                <div key={index} className={`flex items-center gap-3 p-3 rounded-xl
                  ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"} cursor-pointer transition-all`}>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                    {med.nom.charAt(4)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {med.nom}
                    </p>
                    <p className="text-xs text-gray-400">{med.specialite}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`w-2 h-2 rounded-full ${med.disponible ? "bg-green-500" : "bg-red-500"}`} />
                    <p className="text-xs text-gray-400">{med.patients} pts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Résumé rapide */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
              {langue === 'fr' ? "Résumé rapide" : "Quick Summary"}
            </h2>
            <div className="flex flex-col gap-3">
              {[
                { label: langue === 'fr' ? "Lits disponibles" : "Available Beds", value: "12/50", color: "text-green-500" },
                { label: langue === 'fr' ? "Urgences" : "Emergencies", value: "3", color: "text-red-500" },
                { label: langue === 'fr' ? "Opérations prévues" : "Planned Operations", value: "5", color: "text-blue-500" },
                { label: langue === 'fr' ? "Sorties aujourd'hui" : "Discharges Today", value: "8", color: "text-purple-500" },
              ].map((item, index) => (
                <div key={index} className={`flex items-center justify-between py-2 border-b last:border-0
                  ${darkMode ? "border-gray-700" : "border-gray-50"}`}>
                  <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{item.label}</p>
                  <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}