import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import photoMedecin from "../../assets/medecin.png";
import {
  Calendar, Pill, Video, Clock,
  ChevronRight, ShieldAlert, Megaphone,
  Heart, Activity, Droplet, Weight
} from 'lucide-react';

const specialites = [
  { icon: "❤️", nom: "Cardiologue" },
  { icon: "🦷", nom: "Dentiste" },
  { icon: "🧠", nom: "Neurologue" },
  { icon: "👁️", nom: "Ophtalmologue" },
  { icon: "🦴", nom: "Orthopédiste" },
  { icon: "🧬", nom: "Généraliste" },
  { icon: "🫁", nom: "Pneumologue" },
  { icon: "🧪", nom: "Biologiste" },
  { icon: "👶", nom: "Pédiatre" },
  { icon: "🦷", nom: "ORL" },
  { icon: "🩻", nom: "Radiologue" },
  { icon: "💊", nom: "Pharmacien" },
];

const consultationsRecentes = [
  { id: 1, medecin: "Dr. Ngassa Pierre", type: "Dentisterie", date: "10/03/2026", statut: "Terminé", photo: photoMedecin },
  { id: 2, medecin: "Dr. Kamdem Marie", type: "Cardiologie", date: "05/03/2026", statut: "Terminé", photo: photoMedecin },
  { id: 3, medecin: "Dr. Bello Ahmed", type: "Généraliste", date: "28/02/2026", statut: "Annulé", photo: photoMedecin },
  { id: 4, medecin: "Dr. Ngo Sophie", type: "Pédiatrie", date: "13/02/2026", statut: "Terminé", photo: photoMedecin },
  { id: 5, medecin: "Dr. Essomba Paul", type: "Dermatologie", date: "08/02/2026", statut: "Annulé", photo: photoMedecin },
  { id: 6, medecin: "Dr. Foka Jean", type: "Neurologie", date: "02/02/2026", statut: "Annulé", photo: photoMedecin },
];

const actualites = [
  { id: 1, titre: "Campagne de vaccination Polio", desc: "Du 12 au 15 juin dans tous les centres.", color: "bg-red-500" },
  { id: 2, titre: "Alerte Épidémie : Choléra", desc: "Mesures d'hygiène renforcées recommandées.", color: "bg-orange-500" },
  { id: 3, titre: "Journée mondiale de la santé", desc: "Accès gratuit aux consultations ce weekend.", color: "bg-blue-500" },
];

const miseAJour = [
  { id: 1, icon: "🔄", titre: "Mise à jour système", desc: "Nouvelles fonctionnalités de consultation.", temps: "Il y a 2h", color: "bg-blue-100 text-blue-600" },
  { id: 2, icon: "🔒", titre: "Politique de confidentialité", desc: "Modifications de la protection des données.", temps: "Il y a 1 jour", color: "bg-purple-100 text-purple-600" },
  { id: 3, icon: "💳", titre: "Système de paiement", desc: "Les nouveaux paiements mobiles sont intégrés.", temps: "Il y a 3 jours", color: "bg-green-100 text-green-600" },
  { id: 4, icon: "🎯", titre: "Nouveaux médecins", desc: "15 nouveaux spécialistes ont rejoint la plateforme.", temps: "Il y a 5 jours", color: "bg-orange-100 text-orange-600" },
];

// ✅ Résumé santé — format carte 2x2 comme l'image
const santeParams = [
  { label: "Tension artérielle", value: "120/80", unit: "mmHg", statut: "Normal", color: "text-green-500", icon: Activity, iconColor: "text-red-400 bg-red-50" },
  { label: "Rythme cardiaque", value: "62", unit: "bpm", statut: "Faible", color: "text-orange-500", icon: Heart, iconColor: "text-blue-400 bg-blue-50" },
  { label: "Glycémie", value: "129", unit: "mg/dL", statut: "Élevé", color: "text-red-500", icon: Droplet, iconColor: "text-orange-400 bg-orange-50" },
  { label: "Poids", value: "72", unit: "kg", statut: "Normal", color: "text-green-500", icon: Weight, iconColor: "text-purple-400 bg-purple-50" },
];

const stats = [
  { label: "Rendez-vous à venir", value: "04", sub: "Prochain : 10 Jan", icon: Calendar, color: "bg-blue-100 text-blue-500", path: "/rendez-vous" },
  { label: "Consultations ce mois", value: "12", sub: "+12% depuis le mois dernier", icon: Video, color: "bg-orange-100 text-orange-500", path: "/consultations" },
  { label: "Prescriptions actives", value: "05", sub: "2 à renouveler", icon: Pill, color: "bg-green-100 text-green-500", path: "/prescriptions" },
];

// Nombre de notifications non lues (simulé)
const NOTIFS_NON_LUES = 3;

export default function Dashboard({ darkMode }) {
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

  return (
    <div className="p-3 md:p-6">

      {/* Bienvenue + Carousel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-500">Bienvenue, Mle Agine 👋</h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Voici un aperçu de votre santé.
          </p>
        </div>

        {/* Carousel */}
        <div className={`lg:w-80 w-full p-4 rounded-2xl text-white shadow-lg transition-all duration-500 ${actualites[newsIndex].color}`}>
          <div className="flex items-start gap-3">
            <Megaphone size={18} className="mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{actualites[newsIndex].titre}</p>
              <p className="text-xs opacity-90">{actualites[newsIndex].desc}</p>
            </div>
          </div>
          <div className="flex gap-1 mt-3 justify-center">
            {actualites.map((_, i) => (
              <button
                key={i}
                onClick={() => setNewsIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === newsIndex ? "bg-white w-4" : "bg-white/50 w-1.5"}`}
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
            <div
              key={index}
              onClick={() => navigate(stat.path)}
              className={`rounded-2xl shadow p-5 min-h-[130px] flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer
                ${darkMode ? "bg-gray-800" : "bg-white"}`}
            >
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

      {/* ✅ Notification importante avec compteur */}
      {notifVisible && (
        <div
          onClick={handleNotifClick}
          className={`mb-6 p-4 rounded-2xl border-l-4 border-orange-500 shadow-sm flex items-center justify-between cursor-pointer hover:opacity-90 transition-all
            ${darkMode ? "bg-gray-800" : "bg-orange-50"}`}
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-orange-500 flex-shrink-0" size={20} />
            <div>
              <div className="flex items-center gap-2">
                <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  Notifications importantes
                </p>
                {/* ✅ Badge compteur */}
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {NOTIFS_NON_LUES}
                </span>
              </div>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Vos résultats d'examens sont disponibles.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ChevronRight size={16} className="text-orange-500" />
            <button
              onClick={(e) => { e.stopPropagation(); setNotifVisible(false); }}
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
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-semibold">À VENIR</span>
              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Téléconsultation</span>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div onClick={() => navigate(`/medecin/1`)} className="flex items-center gap-4 cursor-pointer">
                <div className="w-14 h-14 bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl rounded-lg">N</div>
                <div>
                  <p className={`font-bold text-lg hover:text-blue-500 transition ${darkMode ? "text-white" : "text-gray-800"}`}>Dr. Ngassa Pierre</p>
                  <p className="text-sm text-blue-400">Dentiste • Contrôle annuel</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-400">Aujourd'hui, 14:00</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate(`/medecin/1`)} className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-600">
                  Reprogrammer
                </button>
                <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-600">
                  <Video size={16} /> Rejoindre
                </button>
              </div>
            </div>
          </div>

          {/* Spécialités */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Explorer les spécialités</h2>
              <button onClick={() => setVoirToutesSpec(!voirToutesSpec)} className="text-xs text-blue-500 hover:underline">
                {voirToutesSpec ? "Voir moins" : "Voir tout"}
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {specialitesAffichees.map((spec, index) => (
                <button
                  key={index}
                  onClick={() => handleSpecialiteClick(spec)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all
                    ${darkMode ? "hover:bg-gray-700" : "hover:bg-blue-50"}`}
                >
                  <span className="text-2xl">{spec.icon}</span>
                  <p className={`text-xs text-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{spec.nom}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Consultations récentes */}
          <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Consultations récentes</h2>
            </div>
            <table className="w-full text-sm">
              <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  {["Médecin", "Type", "Date", "Statut"].map((h) => (
                    <th key={h} className={`text-left px-5 py-3 text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {consultationsRecentes.map((c, index) => (
                  <tr key={index} className={`border-t ${darkMode ? "border-gray-700" : "border-gray-50"}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img src={c.photo} alt={c.medecin} className="w-10 h-10 rounded-xl object-cover border-2 border-blue-500" />
                        <button
                          onClick={() => navigate(`/medecin/${c.id}`)}
                          className={`font-bold hover:text-blue-500 transition-colors text-left ${darkMode ? "text-white" : "text-gray-800"}`}
                        >
                          {c.medecin}
                        </button>
                      </div>
                    </td>
                    <td className={`px-5 py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{c.type}</td>
                    <td className={`px-5 py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{c.date}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold
                        ${c.statut === "Terminé" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
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

         {/* // ✅ Résumé santé — format carte avec scroll */}
<div
  className={`rounded-2xl shadow p-5 ${
    darkMode ? "bg-gray-800" : "bg-white"
  }`}
>
  <div className="flex items-center justify-between mb-1">
    <h2
      className={`font-bold ${
        darkMode ? "text-white" : "text-gray-800"
      }`}
    >
      Résumé santé
    </h2>
  </div>

  <p
    className={`text-xs mb-4 ${
      darkMode ? "text-gray-500" : "text-gray-400"
    }`}
  >
    Dernière mise à jour : il y a 2 jours
  </p>

  {/* 🔹 GRID AVEC SCROLL */}
  <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">

    {santeParams.map((item, index) => {
      const Icon = item.icon;

      return (
        <div
          key={index}
          className={`rounded-2xl p-3 flex flex-col gap-2 ${
            darkMode ? "bg-gray-700" : "bg-gray-50"
          }`}
        >
          {/* Label + icon */}
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.iconColor}`}
            >
              <Icon size={14} />
            </div>

            <p
              className={`text-xs font-medium ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {item.label}
            </p>
          </div>

          {/* Value */}
          <div>
            <p
              className={`text-xl font-bold ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              {item.value}{" "}
              <span
                className={`text-xs font-normal ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {item.unit}
              </span>
            </p>

            <p
              className={`text-xs font-semibold mt-0.5 ${item.color}`}
            >
              {item.statut}
            </p>
          </div>
        </div>
      );
    })}

    {/* 🆕 IMC (fixe si pas dans santeParams) */}
    <div
      className={`rounded-2xl p-3 flex flex-col gap-2 ${
        darkMode ? "bg-gray-700" : "bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-indigo-400 bg-indigo-50">
          ⚖️
        </div>
        <p
          className={`text-xs font-medium ${
            darkMode ? "text-gray-300" : "text-gray-600"
          }`}
        >
          IMC
        </p>
      </div>

      <div>
        <p
          className={`text-xl font-bold ${
            darkMode ? "text-white" : "text-gray-800"
          }`}
        >
          23.5{" "}
          <span
            className={`text-xs font-normal ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            kg/m²
          </span>
        </p>

        <p className="text-xs font-semibold mt-0.5 text-green-500">
          Normal
        </p>
      </div>
    </div>

    {/* 🆕 Saturation O2 */}
    <div
      className={`rounded-2xl p-3 flex flex-col gap-2 ${
        darkMode ? "bg-gray-700" : "bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-400 bg-blue-50">
          💨
        </div>
        <p
          className={`text-xs font-medium ${
            darkMode ? "text-gray-300" : "text-gray-600"
          }`}
        >
          Saturation O2
        </p>
      </div>

      <div>
        <p
          className={`text-xl font-bold ${
            darkMode ? "text-white" : "text-gray-800"
          }`}
        >
          98{" "}
          <span
            className={`text-xs font-normal ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            %
          </span>
        </p>

        <p className="text-xs font-semibold mt-0.5 text-green-500">
          Normal
        </p>
      </div>
    </div>

  </div>
</div>

          {/* Médicaments du jour */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Pill size={18} className="text-green-500" />
              Médicaments du jour
            </h2>
            <div className="flex flex-col gap-2 overflow-y-auto pr-1" style={{ maxHeight: "220px" }}>
              {[
                { nom: "Paracétamol 500mg", heure: "08:00", pris: true },
                { nom: "Metformine 500mg", heure: "12:30", pris: false },
                { nom: "Vitamine C 1g", heure: "18:00", pris: false },
                { nom: "Amoxicilline 1g", heure: "20:00", pris: false },
                { nom: "Doliprane", heure: "22:00", pris: false },
                { nom: "Vitamine D", heure: "07:00", pris: true },
                { nom: "Ibuprofène", heure: "14:00", pris: false },
              ].map((m, i) => (
                <div key={i} className={`flex justify-between items-center p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${m.pris ? "bg-green-500" : "bg-gray-300"}`} />
                    <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{m.nom}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-lg font-medium
                    ${m.pris ? "bg-green-100 text-green-600" : "bg-blue-50 text-blue-600"}`}>
                    {m.pris ? "Pris" : m.heure}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ✅ Mises à jour — cliquables */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>Mises à jour</h2>
            <div className="flex flex-col gap-3">
              {miseAJour.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/miseajour/${item.id}`)}
                  className={`flex items-start gap-3 p-3 rounded-xl text-left w-full transition-all
                    ${darkMode
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-50 hover:bg-blue-50"
                    }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{item.titre}</p>
                    <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{item.desc}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.temps}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-400 mt-1 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}