import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Pill, Video, Clock, ChevronRight, ShieldAlert, Megaphone,
  Heart, Activity, Droplet, Weight, Stethoscope, Eye, Baby, Ear,
  ScanLine, FlaskConical, Brain, Bone, Wind, User, Scale, Wind as WindIcon,
  Smile
} from 'lucide-react';
import { fetchDashboardPatient } from '../../services/dashboardService';

// Mapping icônes Lucide pour spécialités
const SPECIALITE_ICONS = {
  cardiologie: Heart,
  dentisterie: Smile,
  neurologie: Brain,
  ophtalmologie: Eye,
  orthopedie: Bone,
  generale: Stethoscope,
  pneumologie: Wind,
  biologie: FlaskConical,
  pediatrie: Baby,
  orl: Ear,
  radiologie: ScanLine,
  pharmacie: Pill,
};

// Icône par défaut
const DefaultSpecIcon = ({ nom }) => {
  const letter = nom?.[0]?.toUpperCase() || 'S';
  return (
    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
      {letter}
    </div>
  );
};

const getSpecIcon = (spec) => {
  const nom = (spec.nom || spec.code || '').toLowerCase();
  for (const [key, Icon] of Object.entries(SPECIALITE_ICONS)) {
    if (nom.includes(key)) return <Icon size={24} className="text-blue-500" />;
  }
  return <DefaultSpecIcon nom={spec.nom} />;
};

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

const formatDate = (iso) => {
  if (!iso) return "N/A";
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
};

const formatHeure = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return "";
  }
};

const getStatutColor = (statut) => {
  const s = (statut || '').toLowerCase();
  if (['termine', 'terminé', 'effectue'].includes(s)) return "bg-green-100 text-green-600";
  if (['annule', 'annulé'].includes(s)) return "bg-red-100 text-red-500";
  if (['en_attente', 'en cours'].includes(s)) return "bg-yellow-100 text-yellow-600";
  return "bg-blue-100 text-blue-600";
};

export default function Dashboard({ darkMode }) {
  const navigate = useNavigate();
  const [newsIndex, setNewsIndex] = useState(0);
  const [notifVisible, setNotifVisible] = useState(true);
  const [voirToutesSpec, setVoirToutesSpec] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    const charger = async () => {
      try {
        setLoading(true);
        const d = await fetchDashboardPatient();
        setData(d);
      } catch (err) {
        setErreur(err.message);
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNewsIndex((prev) => (prev + 1) % actualites.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (erreur || !data) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50"}`}>
        <p className="text-red-500">{erreur || "Erreur chargement"}</p>
      </div>
    );
  }

  const specialitesAffichees = voirToutesSpec ? data.specialites : data.specialites.slice(0, 6);
  const NOTIFS_NON_LUES = data.nb_notifications_non_lues || 0;

  // Résumé santé avec fallback
  const resume = data.resume_sante || {};
  const santeParams = [
    { label: "Poids", value: resume.poids_kg || "--", unit: "kg", icon: Weight, iconColor: "text-purple-400 bg-purple-50" },
    { label: "Taille", value: resume.taille_cm || "--", unit: "cm", icon: Activity, iconColor: "text-blue-400 bg-blue-50" },
    { label: "IMC", value: resume.imc || "--", unit: "kg/m²", icon: Scale, iconColor: "text-indigo-400 bg-indigo-50" },
    { label: "Groupe", value: resume.groupe_sanguin || "--", unit: "", icon: Droplet, iconColor: "text-red-400 bg-red-50" },
  ];

  const stats = [
    { label: "Rendez-vous à venir", value: String(data.nb_rdv_a_venir).padStart(2, '0'), sub: data.prochain_rdv ? `Prochain : ${formatDate(data.prochain_rdv.date)}` : "Aucun", icon: Calendar, color: "bg-blue-100 text-blue-500", path: "/rendez-vous" },
    { label: "Consultations ce mois", value: String(data.nb_consultations_mois).padStart(2, '0'), sub: "Ce mois-ci", icon: Video, color: "bg-orange-100 text-orange-500", path: "/consultations" },
    { label: "Prescriptions actives", value: String(data.nb_prescriptions).padStart(2, '0'), sub: "En cours", icon: Pill, color: "bg-green-100 text-green-500", path: "/prescriptions" },
  ];

  return (
    <div className={`min-h-screen p-3 md:p-6 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {/* Bienvenue + Carousel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-500">Bienvenue, {data.patient_nom} 👋</h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Voici un aperçu de votre santé.
          </p>
        </div>

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
              className={`rounded-2xl shadow p-5 min-h-[130px] flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer ${darkMode ? "bg-gray-800" : "bg-white"}`}
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

      {/* Notification importante */}
      {notifVisible && NOTIFS_NON_LUES > 0 && (
        <div
          onClick={() => { setNotifVisible(false); navigate('/notifications'); }}
          className={`mb-6 p-4 rounded-2xl border-l-4 border-orange-500 shadow-sm flex items-center justify-between cursor-pointer hover:opacity-90 transition-all ${darkMode ? "bg-gray-800" : "bg-orange-50"}`}
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-orange-500 flex-shrink-0" size={20} />
            <div>
              <div className="flex items-center gap-2">
                <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  Notifications importantes
                </p>
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {NOTIFS_NON_LUES}
                </span>
              </div>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Vous avez des notifications non lues.
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
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-semibold">
                À VENIR
              </span>
              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {data.prochain_rdv?.type || "Consultation"}
              </span>
            </div>

            {data.prochain_rdv ? (
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div onClick={() => navigate(`/medecin/${data.prochain_rdv.id}`)} className="flex items-center gap-4 cursor-pointer">
                  <div className="w-14 h-14 bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl rounded-lg">
                    {data.prochain_rdv.medecin_initiale}
                  </div>
                  <div>
                    <p className={`font-bold text-lg hover:text-blue-500 transition ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {data.prochain_rdv.medecin_nom}
                    </p>
                    <p className="text-sm text-blue-400">{data.prochain_rdv.motif}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {formatDate(data.prochain_rdv.date)}, {formatHeure(data.prochain_rdv.date)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-600">
                    Reprogrammer
                  </button>
                  {data.prochain_rdv.lien_video && (
                    <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-600">
                      <Video size={16} /> Rejoindre
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                <Calendar size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun rendez-vous à venir</p>
                <button
                  onClick={() => navigate('/annuaire')}
                  className="mt-3 text-blue-500 text-sm font-semibold hover:underline"
                >
                  Prendre un rendez-vous
                </button>
              </div>
            )}
          </div>

          {/* Spécialités */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Explorer les spécialités</h2>
              {data.specialites.length > 6 && (
                <button onClick={() => setVoirToutesSpec(!voirToutesSpec)} className="text-xs text-blue-500 hover:underline">
                  {voirToutesSpec ? "Voir moins" : "Voir tout"}
                </button>
              )}
            </div>

            {data.specialites.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {specialitesAffichees.map((spec) => (
                  <button
                    key={spec.id}
                    onClick={() => navigate(`/annuaire?specialite=${encodeURIComponent(spec.nom)}`)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${darkMode ? "hover:bg-gray-700" : "hover:bg-blue-50"}`}
                  >
                    {getSpecIcon(spec)}
                    <p className={`text-xs text-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{spec.nom}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className={`text-sm text-center py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Aucune spécialité disponible
              </p>
            )}
          </div>

          {/* Consultations récentes */}
          <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Consultations récentes</h2>
            </div>

            {data.consultations_recentes.length > 0 ? (
              <table className="w-full text-sm">
                <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                  <tr>
                    {["Médecin", "Motif", "Date", "Statut"].map((h) => (
                      <th key={h} className={`text-left px-5 py-3 text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.consultations_recentes.map((c) => (
                    <tr key={c.id} className={`border-t ${darkMode ? "border-gray-700" : "border-gray-50"}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold border-2 border-blue-500">
                            {c.medecin_initiale}
                          </div>
                          <button
                            onClick={() => navigate(`/consultation/${c.id}`)}
                            className={`font-bold hover:text-blue-500 transition-colors text-left ${darkMode ? "text-white" : "text-gray-800"}`}
                          >
                            {c.medecin}
                          </button>
                        </div>
                      </td>
                      <td className={`px-5 py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{c.motif}</td>
                      <td className={`px-5 py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{formatDate(c.date)}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatutColor(c.statut)}`}>
                          {c.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                <p className="text-sm">Aucune consultation récente</p>
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-6">

          {/* Résumé santé */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Résumé santé</h2>
            <p className={`text-xs mb-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Vos données personnelles
            </p>

            <div className="grid grid-cols-2 gap-3">
              {santeParams.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className={`rounded-2xl p-3 flex flex-col gap-2 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.iconColor}`}>
                        <Icon size={14} />
                      </div>
                      <p className={`text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {item.label}
                      </p>
                    </div>
                    <p className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {item.value} <span className={`text-xs font-normal ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{item.unit}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Médicaments du jour */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Pill size={18} className="text-green-500" />
              Médicaments actifs
            </h2>
            <div className="flex flex-col gap-2 overflow-y-auto pr-1" style={{ maxHeight: "220px" }}>
              {data.medicaments_jour.length > 0 ? (
                data.medicaments_jour.map((m) => (
                  <div key={m.id} className={`flex justify-between items-center p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{m.nom}</p>
                    </div>
                    {m.frequence && (
                      <span className="text-xs px-2 py-1 rounded-lg font-medium bg-blue-50 text-blue-600">
                        {m.frequence}x/jour
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className={`text-sm text-center py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Aucun médicament actif
                </p>
              )}
            </div>
          </div>

          {/* Mises à jour */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>Mises à jour</h2>
            <div className="flex flex-col gap-3">
              {miseAJour.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/miseajour/${item.id}`)}
                  className={`flex items-start gap-3 p-3 rounded-xl text-left w-full transition-all ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-50 hover:bg-blue-50"}`}
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