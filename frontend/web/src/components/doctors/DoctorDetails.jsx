import { useState, useEffect } from "react";
import {
  X,
  FileText,
  Building2,
  MapPin,
  Star,
  BriefcaseBusiness,
  GraduationCap,
  Award,
  Loader2,
} from "lucide-react";
import { get } from "../../services/apiClient";
import AskOpinionModal from "../../components/doctors/AskOpinionModal";
import { getUserTimezone } from "../../utils/timezone";

export default function DoctorDetails({
  doctor,
  onClose,
  showMore,
  setShowMore,
  darkMode,
  currentUserId,
}) {
  const [showOpinionModal, setShowOpinionModal] = useState(false);
  const [fullProfile, setFullProfile] = useState(null);
  const [avis, setAvis] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!doctor?.id) return;
    setLoading(true);
    Promise.all([
      get(`/api/medecins/${doctor.id}`),
      get(`/api/avis`, { medecin_id: doctor.id })
    ]).then(([profileData, avisData]) => {
      setFullProfile(profileData);
      setAvis(Array.isArray(avisData) ? avisData : []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [doctor?.id]);

  if (!doctor) return null;

  const handleAskOpinion = () => {
    setShowOpinionModal(true);
  };

  const handleSendOpinion = (opinionData) => {
    console.log("Demande d'avis envoyée:", opinionData);
  };

  return (
    <>
      <div
        className={`w-full max-h-[90vh] flex flex-col relative p-4 sm:p-5 rounded-3xl ${
          darkMode ? "text-white bg-gray-900" : "text-gray-900 bg-white"
        }`}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className={`
            absolute top-4 right-4 z-10
            w-9 h-9 flex items-center justify-center
            rounded-full border transition
            hover:scale-105 active:scale-95
            ${
              darkMode
                ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                : "bg-white border-gray-200 hover:bg-gray-100"
            }
          `}
        >
          <X className="w-4 h-4" />
        </button>

        {/* SCROLLABLE CONTAINER */}
        <div className="overflow-y-auto space-y-5 pr-1 pt-2">
          {/* IMAGE */}
          <div className="overflow-hidden rounded-2xl">
            <img
              src={doctor.image}
              className="w-full h-52 sm:h-56 object-cover"
              alt={doctor.name}
            />
          </div>

          {/* NAME + SPECIALTY */}
          <div>
            <h2 className="text-xl font-bold">
              {doctor.name}
            </h2>
            <p
              className={`text-sm mt-1 font-medium text-blue-500`}
            >
              {doctor.specialty}
            </p>
          </div>

          {/* INFO GRID */}
          <div className="space-y-3 text-sm border-t pt-4 dark:border-gray-800">
            {/* HOSPITAL */}
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 mt-0.5 opacity-80" />
              <span className="leading-snug">{doctor.hospital || "Non spécifié"}</span>
            </div>

            {/* CITY + RATING */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 opacity-80" />
                <span>{doctor.city || "Non spécifiée"}</span>
              </div>

              <div className="flex items-center gap-1 font-semibold">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span>{doctor.rating.toFixed(1)}</span>
              </div>
            </div>

            {/* EXPERIENCE */}
            <div className="flex items-center gap-2">
              <BriefcaseBusiness className="w-4 h-4 opacity-80" />
              <span>{doctor.experience} ans d'expérience</span>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="border-t pt-4 dark:border-gray-800">
            <div className="flex items-center gap-2 font-semibold mb-2 text-sm">
              <FileText className="w-4 h-4 opacity-80" />
              <span>Biographie</span>
            </div>
            <p
              className={`text-xs leading-relaxed ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {showMore
                ? doctor.description
                : doctor.description?.slice(0, 120) + (doctor.description?.length > 120 ? "…" : "")}
            </p>
            {doctor.description?.length > 120 && (
              <button
                onClick={() => setShowMore(!showMore)}
                className="mt-2 text-xs font-semibold text-blue-500 hover:underline transition"
              >
                {showMore ? "Voir moins" : "Voir plus"}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-blue-500" size={20} />
            </div>
          ) : (
            <>
              {/* FORMATIONS */}
              {fullProfile?.diplomes && fullProfile.diplomes.filter(f => f.statut === 'valide' || !f.statut).length > 0 && (
                <div className="space-y-2 border-t pt-4 dark:border-gray-800">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <GraduationCap size={16} className="text-blue-500" />
                    Formations
                  </h3>
                  <div className="space-y-2">
                    {fullProfile.diplomes.filter(f => f.statut === 'valide' || !f.statut).map((f, i) => (
                      <div key={i} className={`p-3 rounded-xl text-xs ${darkMode ? "bg-gray-850" : "bg-gray-50"}`}>
                        <p className="font-semibold">{f.titre || 'Formation'}</p>
                        <p className="opacity-70 mt-0.5">{[f.ecole, f.date].filter(Boolean).join(' · ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CERTIFICATIONS */}
              {fullProfile?.certifications && fullProfile.certifications.filter(c => c.statut === 'valide' || !c.statut).length > 0 && (
                <div className="space-y-2 border-t pt-4 dark:border-gray-800">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Award size={16} className="text-green-500" />
                    Certifications
                  </h3>
                  <div className="space-y-2">
                    {fullProfile.certifications.filter(c => c.statut === 'valide' || !c.statut).map((c, i) => (
                      <div key={i} className={`p-3 rounded-xl text-xs ${darkMode ? "bg-gray-850" : "bg-gray-50"}`}>
                        <p className="font-semibold">{c.titre || 'Certification'}</p>
                        <p className="opacity-70 mt-0.5">{[c.organisme, c.date].filter(Boolean).join(' · ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EXPERIENCES */}
              {fullProfile?.experience_history && fullProfile.experience_history.filter(e => e.statut === 'valide' || !e.statut).length > 0 && (
                <div className="space-y-2 border-t pt-4 dark:border-gray-800">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <BriefcaseBusiness size={16} className="text-purple-500" />
                    Expériences
                  </h3>
                  <div className="space-y-2">
                    {fullProfile.experience_history.filter(e => e.statut === 'valide' || !e.statut).map((exp, i) => (
                      <div key={i} className={`p-3 rounded-xl text-xs ${darkMode ? "bg-gray-850" : "bg-gray-50"}`}>
                        <p className="font-semibold">{exp.poste || 'Expérience'}</p>
                        <p className="opacity-70 mt-0.5">{[exp.entreprise, exp.date_debut && exp.date_fin ? `${exp.date_debut} - ${exp.date_fin}` : exp.date_debut || ''].filter(Boolean).join(' · ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AVIS PATIENTS */}
              {avis.length > 0 && (
                <div className="space-y-2 border-t pt-4 dark:border-gray-800">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    Avis des patients
                  </h3>
                  <div className="space-y-2">
                    {avis.map((a, i) => (
                      <div key={i} className={`p-3 rounded-xl text-xs ${darkMode ? "bg-gray-855" : "bg-gray-50"}`}>
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-semibold truncate">
                            {a.patient_prenom || a.patient_nom ? `${a.patient_prenom || ''} ${a.patient_nom || ''}`.trim() : "Patient anonyme"}
                          </p>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} size={8} className={s <= a.note ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                            ))}
                          </div>
                        </div>
                        {a.commentaire && <p className="opacity-80 italic mt-0.5">{a.commentaire}</p>}
                        <p className="text-[10px] opacity-50 mt-1">{new Date(a.created_at).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() })}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ACTION BUTTON */}
          <div className="pt-2">
            <button
              onClick={handleAskOpinion}
              disabled={currentUserId === doctor.id || !doctor.available}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                currentUserId === doctor.id || !doctor.available
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
              }`}
              title={
                currentUserId === doctor.id
                  ? "Vous ne pouvez pas demander un avis sur votre propre profil"
                  : !doctor.available
                  ? "Ce médecin est indisponible"
                  : ""
              }
            >
              Demander un avis médical
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DEMANDE D'AVIS */}
      {showOpinionModal && (
        <AskOpinionModal
          darkMode={darkMode}
          doctor={doctor}
          onClose={() => setShowOpinionModal(false)}
          onSend={handleSendOpinion}
        />
      )}
    </>
  );
}
