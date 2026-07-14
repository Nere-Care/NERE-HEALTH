import { useState } from "react";
import { X, FileText, Building2, MapPin, Star, BriefcaseBusiness } from "lucide-react";
import AskOpinionModal from "../../components/doctors/AskOpinionModal";

export default function DoctorDetails({ doctor, onClose, showMore, setShowMore, darkMode }) {
  const [showOpinionModal, setShowOpinionModal] = useState(false);

  if (!doctor) return null;

  const handleAskOpinion = () => {
    setShowOpinionModal(true);
  };

  const handleSendOpinion = async (opinionData) => {
    try {
      console.log("Demande d'avis envoyée:", opinionData);
      // TODO: Appeler l'API backend
      // await sendOpinionRequest(opinionData);
      alert("Demande d'avis envoyée avec succès !");
      setShowOpinionModal(false);
    } catch (err) {
      console.error("Erreur envoi demande:", err);
      alert("Erreur lors de l'envoi de la demande");
    }
  };

  return (
    <>
      <div className={`w-full h-full relative p-4 sm:p-5 rounded-2xl ${darkMode ? "text-white" : "text-gray-900"}`}>
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full border transition hover:scale-105 active:scale-95 ${
            darkMode ? "bg-gray-800 border-gray-700 hover:bg-gray-700" : "bg-white border-gray-200 hover:bg-gray-100"
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* IMAGE */}
        <div className="overflow-hidden rounded-2xl">
          {doctor.image_url ? (
            <img src={doctor.image_url} className="w-full h-56 sm:h-64 object-cover" alt={doctor.nom} />
          ) : (
            <div className="w-full h-56 sm:h-64 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-6xl font-bold">
              {doctor.nom?.charAt(0) || "D"}
            </div>
          )}
        </div>

        {/* NAME + SPECIALTY */}
        <div className="mt-4">
          <h2 className="text-xl sm:text-2xl font-semibold">{doctor.nom}</h2>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {doctor.specialite}
          </p>
        </div>

        {/* INFO GRID */}
        <div className="mt-5 space-y-3 text-sm">
          {/* HOSPITAL */}
          <div className="flex items-start gap-2">
            <Building2 className="w-4 h-4 mt-0.5 opacity-80" />
            <span className="leading-snug">{doctor.structure_nom || "Structure non renseignée"}</span>
          </div>

          {/* CITY + RATING */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 opacity-80" />
              <span>{doctor.ville || "N/A"}</span>
            </div>

            <div className="flex items-center gap-1 font-semibold">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span>{doctor.note_moyenne?.toFixed(1) || "0.0"}</span>
            </div>
          </div>

          {/* EXPERIENCE */}
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="w-4 h-4 opacity-80" />
            <span>{doctor.annees_experience || 0} years experience</span>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="mt-6">
          <div className="flex items-center gap-2 font-semibold mb-2">
            <FileText className="w-4 h-4 opacity-80" />
            <span>Description</span>
          </div>

          <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {showMore
              ? doctor.biographie || "Aucune description disponible"
              : (doctor.biographie || "Aucune description disponible").slice(0, 120) +
                ((doctor.biographie || "").length > 120 ? "…" : "")}
          </p>

          {(doctor.biographie || "").length > 120 && (
            <button
              onClick={() => setShowMore(!showMore)}
              className="mt-2 text-sm font-medium text-blue-500 hover:text-blue-600 hover:underline transition"
            >
              {showMore ? "Voir moins" : "Voir plus"}
            </button>
          )}
        </div>

        {/* ACTION BUTTON */}
        <div className="mt-6">
          <button
            onClick={handleAskOpinion}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Demander un avis médical
          </button>
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