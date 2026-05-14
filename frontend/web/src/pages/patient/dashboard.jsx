import { useState, useEffect } from 'react';
import { useLanguage } from '../../LanguageContext';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, FileText, Pill, Video, Clock,
  ChevronRight, ShieldAlert, Zap, Megaphone,
  Heart, Activity, Droplet, Weight, Ruler, Thermometer
} from 'lucide-react';

const specialites = [
  { icon: "❤️", nom: "Cardiologue", nomEn: "Cardiologist" },
  { icon: "🦷", nom: "Dentiste", nomEn: "Dentist" },
  { icon: "🧠", nom: "Neurologue", nomEn: "Neurologist" },
  { icon: "👁️", nom: "Ophtalmologue", nomEn: "Ophthalmologist" },
  { icon: "🦴", nom: "Orthopédiste", nomEn: "Orthopedist" },
  { icon: "🧬", nom: "Généraliste", nomEn: "General Practitioner" },
  { icon: "🫁", nom: "Pneumologue", nomEn: "Pulmonologist" },
  { icon: "🧪", nom: "Biologiste", nomEn: "Biologist" },
  { icon: "👶", nom: "Pédiatre", nomEn: "Pediatrician" },
  { icon: "🦷", nom: "ORL", nomEn: "ENT Specialist" },
  { icon: "🩻", nom: "Radiologue", nomEn: "Radiologist" },
  { icon: "💊", nom: "Pharmacien", nomEn: "Pharmacist" },
];

const consultationsRecentes = [
  { id: 1, medecin: "Dr. Ngassa Pierre", type: "Dentisterie", date: "10/03/2026", statut: "Terminé" },
  { id: 2, medecin: "Dr. Kamdem Marie", type: "Cardiologie", date: "05/03/2026", statut: "Terminé" },
  { id: 3, medecin: "Dr. Bello Ahmed", type: "Généraliste", date: "28/02/2026", statut: "Annulé" },
];

const actualites = [
  { id: 1, titre: "Campagne de vaccination Polio", desc: "Du 12 au 15 juin dans tous les centres.", color: "bg-red-500" },
  { id: 2, titre: "Alerte Épidémie : Choléra", desc: "Mesures d'hygiène renforcées recommandées.", color: "bg-orange-500" },
  { id: 3, titre: "Journée mondiale de la santé", desc: "Accès gratuit aux consultations ce weekend.", color: "bg-blue-500" },
];

const miseAJour = [
  { icon: "🔄", titre: "Mise à jour système", desc: "Nouvelles fonctionnalités de consultation et amélioration des performances.", temps: "Il y a 2h", color: "bg-blue-100 text-blue-600" },
  { icon: "🔒", titre: "Politique de confidentialité", desc: "Modifications de la protection des données et confidentialité des patients.", temps: "Il y a 1 jour", color: "bg-purple-100 text-purple-600" },
  { icon: "💳", titre: "Système de paiement", desc: "Les nouveaux paiements mobiles sont désormais intégrés.", temps: "Il y a 3 jours", color: "bg-green-100 text-green-600" },
  { icon: "🎯", titre: "Nouveaux médecins", desc: "15 nouveaux spécialistes ont rejoint la plateforme.", temps: "Il y a 5 jours", color: "bg-orange-100 text-orange-600" },
];

const santeParams = [
  { label: "Tension", value: "120/80", unit: "mmHg", statut: "Normal", color: "text-green-500" },
  { label: "Glycémie", value: "129", unit: "mg/dL", statut: "Élevé", color: "text-red-500" },
  { label: "Poids", value: "72", unit: "kg", statut: "Normal", color: "text-blue-500" },
  { label: "Taille", value: "175", unit: "cm", statut: "Normal", color: "text-blue-500" },
  { label: "Rythme cardiaque", value: "62", unit: "bpm", statut: "Faible", color: "text-orange-500" },
  { label: "Température", value: "36.8", unit: "°C", statut: "Normal", color: "text-green-500" },
  { label: "IMC", value: "23.5", unit: "kg/m²", statut: "Normal", color: "text-green-500" },
  { label: "Saturation O2", value: "98", unit: "%", statut: "Normal", color: "text-green-500" },
];

export default function Dashboard({ darkMode }) {
  const { langue } = useLanguage();
  const navigate = useNavigate();
  const [newsIndex, setNewsIndex] = useState(0);
  const [notifVisible, setNotifVisible] = useState(true);
  const [voirToutesSpec, setVoirToutesSpec] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNewsIndex((prev) => (prev + 1) % actualites.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleNotifClick = () => {
    setNotifVisible(false);
    navigate('/notifications');
  };

  const handleSpecialiteClick = (spec) => {
    navigate(`/annuaire?specialite=${encodeURIComponent(spec.nom)}`);
  };

  const specialitesAffichees = voirToutesSpec ? specialites : specialites.slice(0, 6);

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
      label: langue === 'fr' ? "Prescriptions actives" : "Active Prescriptions",
      value: "05",
      sub: langue === 'fr' ? "2 à renouveler" : "2 need refill",
      icon: Pill,
      color: "bg-green-100 text-green-500"
    },
  ];

  return (
    <div className="p-3 md:p-6">

      {/* Bienvenue + Carousel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-3 -mt-5">
        <div>
          <h1 className="text-2xl font-bold text-blue-500">
            {langue === 'fr' ? "Bienvenue, Mle Agine 👋" : "Welcome back, Mle Agine 👋"}
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {langue === 'fr' ? "Voici un aperçu de votre santé." : "Here's an overview of your health."}
          </p>
        </div>

        {/* Carousel actualités */}
        <div className={`lg:w-80 w-full p-4 rounded-2xl text-white shadow-lg transition-all duration-500 ${actualites[newsIndex].color}`}>
          <div className="flex items-start gap-3">
            <Megaphone size={18} className="mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{actualites[newsIndex].titre}</p>
              <p className="text-xs opacity-90">{actualites[newsIndex].desc}</p>
            </div>
          </div>
          {/* Indicateurs */}
          <div className="flex gap-1 mt-3 justify-center">
            {actualites.map((_, i) => (
              <button
                key={i}
                onClick={() => setNewsIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === newsIndex ? "bg-white w-4" : "bg-white/50"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index}
              className={`rounded-2xl shadow p-5 min-h-[130px] flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
                ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="flex justify-end">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="-mt-7">
                <p className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${darkMode ? "text-white" : "text-gray-800"}`}>{stat.value}</p>
                <p className="text-sm text-green-500 mt-1">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

    {/* Notification importante - disparaît au clic ou fermeture */}
{notifVisible && (
  <div
    onClick={handleNotifClick}
    className={`mb-6 p-4 rounded-2xl border-l-4 border-orange-500 shadow-sm flex items-center justify-between cursor-pointer hover:opacity-90 transition-all relative
      ${darkMode ? "bg-gray-800" : "bg-orange-50"}`}
  >

    {/* CONTENU */}
    <div className="flex items-center gap-3">
      <ShieldAlert className="text-orange-500 flex-shrink-0" size={20} />

      <div>
        <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
          {langue === 'fr' ? "Notification importante" : "Important Notification"}
        </p>

        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          {langue === 'fr'
            ? "Vos résultats d'examens sont disponibles."
            : "Your examination results are available."}
        </p>
      </div>
    </div>

    {/* ACTIONS DROITE */}
    <div className="flex items-center gap-2">

      {/* CHEVRON */}
      <ChevronRight size={16} className="text-orange-500" />

      {/* CROIX */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // 🔥 empêche ouverture notif
          setNotifVisible(false);
        }}
        className="text-orange-500 hover:text-red-500 text-lg font-bold px-2"
      >
        ✕
      </button>

    </div>
  </div>
)}

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Colonne gauche */}
        <div className="lg:col-span-2 flex flex-col gap-6">
{/* Prochain rendez-vous */}
<div
  className={`rounded-2xl shadow p-5 transition-all hover:shadow-xl cursor-pointer
  ${darkMode ? "bg-gray-800" : "bg-white"}`}
>
  <div className="flex items-center gap-2 mb-4">
    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-semibold">
      {langue === 'fr' ? "À VENIR" : "UPCOMING"}
    </span>
    <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
      {langue === 'fr' ? "Téléconsultation" : "Video Consultation"}
    </span>
  </div>

  <div className="flex items-center justify-between flex-wrap gap-4">

    {/* MÉDECIN (CLICABLE PROFIL) */}
    <div
      onClick={() => navigate(`/medecin/1`)}
      className="flex items-center gap-4 cursor-pointer"
    >

      {/* PHOTO CARRE */}
      <div className="w-14 h-14 bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl rounded-lg">
        N
      </div>

      {/* INFOS */}
      <div>
        <p className={`font-bold text-lg hover:text-blue-500 transition ${darkMode ? "text-white" : "text-gray-800"}`}>
          Dr. Ngassa Pierre
        </p>

        <p className="text-sm text-blue-400">
          {langue === 'fr'
            ? "Dentiste • Contrôle annuel"
            : "Dentist • Annual Checkup"}
        </p>

        {/* HEURE */}
        <div className="flex items-center gap-1 mt-1">
          <Clock size={12} className="text-gray-400" />
          <span className="text-xs text-gray-400">
            {langue === 'fr' ? "Aujourd'hui, 14:00" : "Today, 2:00 PM"}
          </span>
        </div>
      </div>
    </div>

    {/* BOUTONS */}
    <div className="flex items-center gap-2">

      {/* PROFIL */}
  <button
  onClick={() => navigate(`/medecin/1`)}
  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-600"
>
  {langue === 'fr' ? "Reprogrammer" : "Reschedule"}
</button>

      {/* REJOINDRE */}
      <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-600">
        <Video size={16} />
        {langue === 'fr' ? "Rejoindre" : "Join Call"}
      </button>

    </div>

  </div>
</div>

          {/* Spécialités cliquables */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                {langue === 'fr' ? "Explorer les spécialités" : "Explore Departments"}
              </h2>
              <button
                onClick={() => setVoirToutesSpec(!voirToutesSpec)}
                className="text-xs text-blue-500 hover:underline"
              >
                {voirToutesSpec
                  ? langue === 'fr' ? "Voir moins" : "Show less"
                  : langue === 'fr' ? "Voir tout" : "View All"}
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {specialitesAffichees.map((spec, index) => (
                <button
                  key={index}
                  onClick={() => handleSpecialiteClick(spec)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer transition-all
                    ${darkMode ? "hover:bg-gray-700" : "hover:bg-blue-50"}`}
                >
                  <span className="text-2xl">{spec.icon}</span>
                  <p className={`text-xs text-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {langue === 'fr' ? spec.nom : spec.nomEn}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Consultations récentes */}
          <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                {langue === 'fr' ? "Consultations récentes" : "Recent Consultations"}
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  {[
                    langue === 'fr' ? "Médecin" : "Doctor",
                    langue === 'fr' ? "Type" : "Type",
                    langue === 'fr' ? "Date" : "Date",
                    langue === 'fr' ? "Statut" : "Status"
                  ].map((h) => (
                    <th key={h} className={`text-left px-5 py-3 text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {consultationsRecentes.map((c, index) => (
                  <tr key={index} className={`border-t ${darkMode ? "border-gray-700" : "border-gray-50"}`}>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => navigate(`/medecin/${c.id}`)}
                        className={`font-bold hover:text-blue-500 transition-colors ${darkMode ? "text-white" : "text-gray-800"}`}
                      >
                        {c.medecin}
                      </button>
                    </td>
                    <td className={`px-5 py-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{c.type}</td>
                    <td className={`px-5 py-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{c.date}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold
                        ${c.statut === "Terminé" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                        {langue === 'fr' ? c.statut : c.statut === "Terminé" ? "Completed" : "Cancelled"}
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

          {/* Résumé santé avec scroll */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
              {langue === 'fr' ? "Résumé santé" : "Health Summary"}
            </h2>
            <div className="overflow-y-auto max-h-52 flex flex-col gap-3 pr-1">
              {santeParams.map((item, index) => (
                <div key={index} className={`p-3 rounded-xl flex justify-between items-center
                  ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <div>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {item.value} <span className="text-xs font-normal text-gray-400">{item.unit}</span>
                    </p>
                  </div>
                  <span className={`text-xs font-semibold ${item.color}`}>{item.statut}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Médicaments à prendre */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Pill size={18} className="text-green-500" />
              {langue === 'fr' ? "Médicaments du jour" : "Today's Medications"}
            </h2>
            <div className="flex flex-col gap-2">
              {[
                { nom: "Paracétamol 500mg", heure: "08:00", pris: true },
                { nom: "Metformine 500mg", heure: "12:30", pris: false },
                { nom: "Vitamine C 1g", heure: "18:00", pris: false },
              ].map((m, i) => (
                <div key={i} className={`flex justify-between items-center p-2.5 rounded-xl
                  ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${m.pris ? "bg-green-500" : "bg-gray-300"}`} />
                    <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{m.nom}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-lg font-medium
                    ${m.pris ? "bg-green-100 text-green-600" : "bg-blue-50 text-blue-600"}`}>
                    {m.pris ? langue === 'fr' ? "Pris" : "Taken" : m.heure}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mises à jour avec scroll - style Clinexa */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                <Zap size={16} className="text-yellow-500" />
                {langue === 'fr' ? "Nouvelles & Mises à jour" : "News & Updates"}
              </h2>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                {miseAJour.length} {langue === 'fr' ? "updates" : "updates"}
              </span>
            </div>

            {/* Liste scrollable */}
            <div className="overflow-y-auto max-h-64 flex flex-col gap-3 pr-1">
              {miseAJour.map((item, index) => (
                <div key={index} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all
                  ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{item.titre}</p>
                    <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{item.desc}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.temps}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}