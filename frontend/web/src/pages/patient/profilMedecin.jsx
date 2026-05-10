import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Clock, Heart, Video, User, ArrowLeft, CheckCircle, Calendar } from 'lucide-react';
import { useLanguage } from '../../LanguageContext';
import { medecins } from '../../constants/medecins';

const creneaux = [
  { date: "Lun 12 Mai", heures: ["09:00", "10:00", "11:00", "14:00", "15:00"] },
  { date: "Mar 13 Mai", heures: ["08:30", "09:30", "11:30", "14:30", "16:00"] },
  { date: "Mer 14 Mai", heures: ["09:00", "10:30", "13:00", "15:30"] },
  { date: "Jeu 15 Mai", heures: ["08:00", "10:00", "14:00", "16:30"] },
];

const avis = [
  { nom: "Marie K.", note: 5, commentaire: "Excellent médecin, très à l'écoute et professionnel.", date: "10/03/2026" },
  { nom: "Paul B.", note: 4, commentaire: "Très bonne consultation, je recommande vivement.", date: "05/03/2026" },
  { nom: "Sophie N.", note: 5, commentaire: "Docteur très compétent et rassurant.", date: "28/02/2026" },
];

export default function ProfilMedecin({ darkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { langue } = useLanguage();

  const medecin = medecins.find(m => m.id === parseInt(id));

  const [etape, setEtape] = useState(null);
  const [pourQui, setPourQui] = useState(null);
  const [motif, setMotif] = useState("");
  const [mode, setMode] = useState(null);
  const [creneau, setCreneau] = useState(null);
  const [favori, setFavori] = useState(medecin?.favoris || false);
  const [confirme, setConfirme] = useState(false);

  if (!medecin) return (
    <div className="p-8 text-center text-gray-400">
      {langue === 'fr' ? "Médecin introuvable" : "Doctor not found"}
    </div>
  );

  const handleReserver = () => setEtape("pourQui");

  const handleConfirmer = () => {
    setEtape(null);
    setConfirme(true);
    setTimeout(() => setConfirme(false), 4000);
  };

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {/* Bouton retour */}
      <button
        onClick={() => navigate('/annuaire')}
        className={`flex items-center gap-2 mb-6 text-sm font-medium transition-all
          ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
      >
        <ArrowLeft size={18} />
        {langue === 'fr' ? "Retour à l'annuaire" : "Back to Directory"}
      </button>

      {/* Message confirmation */}
      {confirme && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2">
          <CheckCircle size={18} />
          {langue === 'fr' ? "Rendez-vous confirmé !" : "Appointment confirmed!"}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Colonne gauche */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Carte profil */}
          <div className={`rounded-2xl shadow p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex flex-col sm:flex-row gap-5">

              {/* Photo */}
              <div className="relative flex-shrink-0">
                <div className={`w-28 h-28 rounded-2xl flex items-center justify-center
                  ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                  <User size={52} className="text-blue-300" />
                </div>
                <div className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-xs font-semibold
                  ${medecin.disponible ? "bg-green-500 text-white" : "bg-gray-400 text-white"}`}>
                  {medecin.disponible
                    ? langue === 'fr' ? "Disponible" : "Available"
                    : langue === 'fr' ? "Indisponible" : "Unavailable"}
                </div>
              </div>

              {/* Infos */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {medecin.nom}
                    </h1>
                    <p className="text-blue-500 font-medium">
                      {langue === 'fr' ? medecin.specialite : medecin.specialiteEn}
                    </p>
                  </div>
                  <button onClick={() => setFavori(!favori)}>
                    <Heart size={22} className={favori ? "text-red-500 fill-red-500" : "text-gray-400"} />
                  </button>
                </div>

                {/* Note */}
                <div className="flex items-center gap-2 mt-2">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} size={14}
                      className={s <= Math.round(medecin.note) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                  ))}
                  <span className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {medecin.note}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({medecin.avis} {langue === 'fr' ? "avis" : "reviews"})
                  </span>
                </div>

                {/* Détails */}
                <div className="flex flex-wrap gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-gray-400" />
                    <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {medecin.experience} {langue === 'fr' ? "d'expérience" : "experience"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-gray-400" />
                    <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {medecin.clinique} • {medecin.ville}
                    </span>
                  </div>
                </div>

                {/* Modes */}
                <div className="flex gap-2 mt-3">
                  {medecin.modes.map((m) => (
                    <span key={m} className={`flex items-center gap-1 text-xs px-3 py-1 rounded-lg font-medium
                      ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                      {m === "Video" ? <Video size={12} /> : <User size={12} />}
                      {langue === 'fr' ? m : m === "Video" ? "Video" : "In-Person"}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className={`mt-5 pt-5 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <h3 className={`text-sm font-bold mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                {langue === 'fr' ? "À propos" : "About"}
              </h3>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {langue === 'fr' ? medecin.description : medecin.descriptionEn}
              </p>
            </div>
          </div>

          {/* Avis patients */}
          <div className={`rounded-2xl shadow p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
              {langue === 'fr' ? "Avis des patients" : "Patient Reviews"}
            </h2>
            <div className="flex flex-col gap-4">
              {avis.map((a, index) => (
                <div key={index} className={`p-4 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {a.nom.charAt(0)}
                      </div>
                      <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{a.nom}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={11}
                          className={s <= a.note ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                      ))}
                    </div>
                  </div>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{a.commentaire}</p>
                  <p className="text-xs text-gray-400 mt-1">{a.date}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Colonne droite - Réservation */}
        <div className="flex flex-col gap-4">

          {/* Bouton réserver */}
          {!etape && (
            <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`font-bold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                {langue === 'fr' ? "Prendre rendez-vous" : "Book Appointment"}
              </h2>
              <p className="text-xs text-blue-400 mb-4">
                <Calendar size={12} className="inline mr-1" />
                {langue === 'fr' ? "Prochain : " : "Next: "}
                {langue === 'fr' ? medecin.prochainRdv : medecin.prochainRdvEn}
              </p>
              <button
                onClick={handleReserver}
                disabled={!medecin.disponible}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all
                  ${medecin.disponible
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
              >
                {medecin.disponible
                  ? langue === 'fr' ? "Réserver une consultation" : "Book a Consultation"
                  : langue === 'fr' ? "Indisponible" : "Unavailable"}
              </button>
            </div>
          )}

          {/* ÉTAPE 1 - Pour qui ? */}
          {etape === "pourQui" && (
            <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
                {langue === 'fr' ? "Pour qui est ce rendez-vous ?" : "Who is this appointment for?"}
              </h2>
              <div className="flex flex-col gap-2">
                {[
                  { val: "moi", label: langue === 'fr' ? "Pour moi" : "For me" },
                  { val: "proche", label: langue === 'fr' ? "Pour un proche" : "For someone else" },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => { setPourQui(opt.val); setEtape("motif"); }}
                    className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all text-left
                      ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setEtape(null)} className="text-xs text-gray-400 mt-3 hover:underline">
                {langue === 'fr' ? "Annuler" : "Cancel"}
              </button>
            </div>
          )}

          {/* ÉTAPE 2 - Motif */}
          {etape === "motif" && (
            <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
                {langue === 'fr' ? "Motif de consultation" : "Reason for consultation"}
              </h2>
              <div className="flex flex-col gap-2 mb-4">
                {[
                  langue === 'fr' ? "Consultation générale" : "General consultation",
                  langue === 'fr' ? "Suivi de traitement" : "Treatment follow-up",
                  langue === 'fr' ? "Urgence" : "Emergency",
                  langue === 'fr' ? "Renouvellement d'ordonnance" : "Prescription renewal",
                  langue === 'fr' ? "Autre" : "Other",
                ].map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMotif(m); setEtape("mode"); }}
                    className={`px-4 py-2.5 rounded-xl text-sm border text-left transition-all
                      ${motif === m
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : darkMode
                          ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button onClick={() => setEtape("pourQui")} className="text-xs text-gray-400 hover:underline">
                {langue === 'fr' ? "← Retour" : "← Back"}
              </button>
            </div>
          )}

          {/* ÉTAPE 3 - Mode */}
          {etape === "mode" && (
            <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
                {langue === 'fr' ? "Mode de consultation" : "Consultation mode"}
              </h2>
              <div className="flex flex-col gap-2 mb-4">
                {medecin.modes.map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setEtape("creneau"); }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm border transition-all
                      ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300"}`}
                  >
                    {m === "Video" ? <Video size={16} className="text-blue-500" /> : <User size={16} className="text-green-500" />}
                    {langue === 'fr' ? m : m === "Video" ? "Video" : "In-Person"}
                  </button>
                ))}
              </div>
              <button onClick={() => setEtape("motif")} className="text-xs text-gray-400 hover:underline">
                {langue === 'fr' ? "← Retour" : "← Back"}
              </button>
            </div>
          )}

          {/* ÉTAPE 4 - Créneaux */}
          {etape === "creneau" && (
            <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
                {langue === 'fr' ? "Choisir un créneau" : "Choose a time slot"}
              </h2>
              <div className="flex flex-col gap-4">
                {creneaux.map((jour) => (
                  <div key={jour.date}>
                    <p className={`text-xs font-semibold mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {jour.date}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {jour.heures.map((h) => (
                        <button
                          key={h}
                          onClick={() => setCreneau(`${jour.date} ${h}`)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                            ${creneau === `${jour.date} ${h}`
                              ? "bg-blue-600 text-white border-blue-600"
                              : darkMode
                                ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                                : "border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300"}`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setEtape("confirmation")}
                disabled={!creneau}
                className={`w-full mt-4 py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${creneau ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
              >
                {langue === 'fr' ? "Continuer" : "Continue"}
              </button>
              <button onClick={() => setEtape("mode")} className="text-xs text-gray-400 mt-2 hover:underline block">
                {langue === 'fr' ? "← Retour" : "← Back"}
              </button>
            </div>
          )}

          {/* ÉTAPE 5 - Confirmation */}
          {etape === "confirmation" && (
            <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
                {langue === 'fr' ? "Confirmer le rendez-vous" : "Confirm Appointment"}
              </h2>
              <div className={`rounded-xl p-4 flex flex-col gap-3 mb-4 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                {[
                  { label: langue === 'fr' ? "Médecin" : "Doctor", value: medecin.nom },
                  { label: langue === 'fr' ? "Pour" : "For", value: pourQui === "moi" ? langue === 'fr' ? "Moi" : "Me" : langue === 'fr' ? "Un proche" : "Someone else" },
                  { label: langue === 'fr' ? "Motif" : "Reason", value: motif },
                  { label: langue === 'fr' ? "Mode" : "Mode", value: mode },
                  { label: langue === 'fr' ? "Créneau" : "Time slot", value: creneau },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-xs text-gray-400">{item.label}</span>
                    <span className={`text-xs font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{item.value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleConfirmer}
                className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition-all"
              >
                {langue === 'fr' ? "✓ Confirmer le rendez-vous" : "✓ Confirm Appointment"}
              </button>
              <button onClick={() => setEtape("creneau")} className="text-xs text-gray-400 mt-2 hover:underline block">
                {langue === 'fr' ? "← Retour" : "← Back"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}