import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Clock, Heart, Video, User, ArrowLeft, CheckCircle, Calendar } from 'lucide-react';
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

  const handleReserver = () => setEtape("pourQui");

  const handleConfirmer = () => {
    setEtape(null);
    setConfirme(true);
    setTimeout(() => setConfirme(false), 4000);
  };

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {/* Retour */}
      <button
        onClick={() => navigate('/annuaire')}
        className={`flex items-center gap-2 mb-6 text-sm font-medium
          ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
      >
        <ArrowLeft size={18} />
        Retour à l'annuaire
      </button>

      {/* Confirmation */}
      {confirme && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2">
          <CheckCircle size={18} />
          Rendez-vous confirmé !
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Profil */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          <div className={`rounded-2xl shadow p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>

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
                    <p className="text-blue-500 font-medium">
                      {medecin.specialite}
                    </p>
                  </div>

                  <button onClick={() => setFavori(!favori)}>
                    <Heart size={22} className={favori ? "text-red-500 fill-red-500" : "text-gray-400"} />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {[1,2,3,4,5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      className={s <= Math.round(medecin.note) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                    />
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
          <div className={`rounded-2xl shadow p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className="font-bold mb-4">Avis des patients</h2>

            {avis.map((a, i) => (
              <div key={i} className={`p-4 rounded-xl mb-3 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <div className="flex justify-between">
                  <p className="font-semibold">{a.nom}</p>
                  <span>{a.note}/5</span>
                </div>
                <p className="text-xs text-gray-500">{a.commentaire}</p>
                <p className="text-xs text-gray-400">{a.date}</p>
              </div>
            ))}
          </div>

        </div>

        {/* Réservation */}
        <div className="flex flex-col gap-4">

          {!etape && (
            <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className="font-bold mb-2">Prendre rendez-vous</h2>

              <button
                onClick={handleReserver}
                disabled={!medecin.disponible}
                className={`w-full py-3 rounded-xl font-semibold text-sm
                  ${medecin.disponible
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
              >
                Réserver une consultation
              </button>
            </div>
          )}

          {/* Étapes simplifiées (sans langue aussi) */}
          {etape === "pourQui" && (
            <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className="font-bold mb-4">Pour qui ?</h2>

              {["Pour moi", "Pour un proche"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setPourQui(opt); setEtape("motif"); }}
                  className="w-full text-left px-4 py-3 border rounded-xl mb-2"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}