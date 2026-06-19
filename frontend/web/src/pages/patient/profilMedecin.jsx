import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Clock, Heart, User, ArrowLeft, CheckCircle, Video, Stethoscope } from 'lucide-react';
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
      Médecin introuvable
    </div>
  );

  const handleConfirmer = () => {
    setEtape(null);
    setPourQui(null);
    setMotif("");
    setMode(null);
    setCreneau(null);
    setConfirme(true);
    setTimeout(() => setConfirme(false), 4000);
  };

  const cardClass = `rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`;
  const btnSecondary = `w-full text-left px-4 py-3 border rounded-xl mb-2 text-sm font-medium transition-all`;
  const btnSelected = `border-blue-500 bg-blue-50 text-blue-600`;
  const btnNormal = darkMode
    ? "border-gray-600 text-gray-200 hover:bg-gray-700"
    : "border-gray-200 text-gray-700 hover:bg-gray-50";

  return (
    <div className={`p-4 md:p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {/* Retour */}
      <button
        onClick={() => navigate(-1)}
        className={`flex items-center gap-2 mb-6 text-sm font-medium
          ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
      >
        <ArrowLeft size={18} />
        Retour à l'annuaire
      </button>

      {/* Notification confirmation */}
      {confirme && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2">
          <CheckCircle size={18} />
          Rendez-vous confirmé !
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Colonne gauche : Profil + Avis ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Carte profil */}
          <div className={cardClass}>
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="relative flex-shrink-0">
                <div className={`w-28 h-28 rounded-2xl flex items-center justify-center
                  ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                  <User size={52} className="text-blue-300" />
                </div>
                <div className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-xs font-semibold
                  ${medecin.disponible ? "bg-green-500 text-white" : "bg-gray-400 text-white"}`}>
                  {medecin.disponible ? "Disponible" : "Indisponible"}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {medecin.nom}
                    </h1>
                    <p className="text-blue-500 font-medium">{medecin.specialite}</p>
                  </div>
                  <button onClick={() => setFavori(!favori)}>
                    <Heart size={22} className={favori ? "text-red-500 fill-red-500" : "text-gray-400"} />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} size={14}
                      className={s <= Math.round(medecin.note) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                  ))}
                  <span className="text-sm font-semibold">{medecin.note}</span>
                  <span className="text-xs text-gray-400">({medecin.avis} avis)</span>
                </div>

                <div className="flex flex-wrap gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-sm">{medecin.experience} d'expérience</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-sm">{medecin.clinique} • {medecin.ville}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Avis */}
          <div className={cardClass}>
            <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
              Avis des patients
            </h2>
            {avis.map((a, i) => (
              <div key={i} className={`p-4 rounded-xl mb-3 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <div className="flex justify-between mb-1">
                  <p className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>{a.nom}</p>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} size={10}
                        className={s <= a.note ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                    ))}
                  </div>
                </div>
                <p className={`text-xs mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{a.commentaire}</p>
                <p className="text-xs text-gray-400">{a.date}</p>
              </div>
            ))}
          </div>

        </div>

        {/* ── Colonne droite : Réservation ── */}
        <div className="flex flex-col gap-4">

          {/* ── ÉTAPE 0 : Bouton initial ── */}
          {!etape && (
            <div className={cardClass}>
              <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
                Prendre rendez-vous
              </h2>
              <p className={`text-xs mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Consultation à partir de{" "}
                <span className="font-bold text-blue-500">{medecin.tarif} FCFA</span>
              </p>
              <button
                onClick={() => setEtape("pourQui")}
                disabled={!medecin.disponible}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all
                  ${medecin.disponible
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
              >
                Réserver une consultation
              </button>
            </div>
          )}

          {/* ── ÉTAPE 1 : Pour qui ? ── */}
          {etape === "pourQui" && (
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  Pour qui ?
                </h2>
                <span className="text-xs text-gray-400">Étape 1/4</span>
              </div>

              {["Pour moi", "Pour un proche"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setPourQui(opt); setEtape("motif"); }}
                  className={`${btnSecondary} ${pourQui === opt ? btnSelected : btnNormal}`}
                >
                  {opt}
                </button>
              ))}

              <button
                onClick={() => setEtape(null)}
                className="w-full text-center text-xs text-gray-400 mt-2 hover:underline"
              >
                Annuler
              </button>
            </div>
          )}

          {/* ── ÉTAPE 2 : Motif ── */}
          {etape === "motif" && (
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  Motif de consultation
                </h2>
                <span className="text-xs text-gray-400">Étape 2/4</span>
              </div>

              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Décrivez brièvement votre motif de consultation..."
                rows={4}
                className={`w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none focus:border-blue-400
                  ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "border-gray-200 text-gray-800"}`}
              />

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setEtape("pourQui")}
                  className={`flex-1 py-2.5 rounded-xl text-sm border font-medium
                    ${darkMode ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600"}`}
                >
                  Retour
                </button>
                <button
                  onClick={() => setEtape("mode")}
                  disabled={!motif.trim()}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
                    ${motif.trim()
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 : Mode ── */}
          {etape === "mode" && (
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  Mode de consultation
                </h2>
                <span className="text-xs text-gray-400">Étape 3/4</span>
              </div>

              {[
                { val: "presentiel", label: "En présentiel", desc: "Consultation au cabinet", icon: Stethoscope },
                { val: "teleconsultation", label: "Téléconsultation", desc: "Consultation en vidéo", icon: Video },
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.val}
                    onClick={() => { setMode(opt.val); setEtape("creneau"); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 border rounded-xl mb-2 text-left transition-all
                      ${mode === opt.val ? btnSelected : btnNormal}`}
                  >
                    <Icon size={18} className={mode === opt.val ? "text-blue-500" : "text-gray-400"} />
                    <div>
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="text-xs text-gray-400">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}

              <button
                onClick={() => setEtape("motif")}
                className={`w-full py-2.5 rounded-xl text-sm border font-medium mt-2
                  ${darkMode ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600"}`}
              >
                Retour
              </button>
            </div>
          )}

          {/* ── ÉTAPE 4 : Créneau ── */}
          {etape === "creneau" && (
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  Choisir un créneau
                </h2>
                <span className="text-xs text-gray-400">Étape 4/4</span>
              </div>

              <div className="flex flex-col gap-4 max-h-72 overflow-y-auto pr-1">
                {creneaux.map((c) => (
                  <div key={c.date}>
                    <p className={`text-xs font-semibold mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {c.date}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {c.heures.map((h) => (
                        <button
                          key={h}
                          onClick={() => setCreneau({ date: c.date, heure: h })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                            ${creneau?.date === c.date && creneau?.heure === h
                              ? "bg-blue-600 text-white border-blue-600"
                              : darkMode
                                ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                                : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setEtape("mode")}
                  className={`flex-1 py-2.5 rounded-xl text-sm border font-medium
                    ${darkMode ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600"}`}
                >
                  Retour
                </button>
                <button
                  onClick={handleConfirmer}
                  disabled={!creneau}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
                    ${creneau
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                >
                  Confirmer
                </button>
              </div>
            </div>
          )}

          {/* Résumé créneau sélectionné */}
          {creneau && etape === "creneau" && (
            <div className={`rounded-xl p-3 text-xs ${darkMode ? "bg-gray-700 text-gray-300" : "bg-blue-50 text-blue-700"}`}>
              <p className="font-semibold">Créneau sélectionné :</p>
              <p>{creneau.date} à {creneau.heure}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}