import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X, Stethoscope, AlertCircle, Sparkles, Star,
  Video, ArrowRight, CheckCircle,
} from "lucide-react";
import { analyserSymptomes } from "../../services/symptomService";

const SYMPTOMES_RAPIDES = [
  "Fievre", "Toux", "Maux de tete", "Douleur au ventre",
  "Fatigue", "Douleur au dos", "Eruption cutanee", "Vertiges",
];

export default function SymptomCheckerModal({ darkMode, open, onClose }) {
  const navigate = useNavigate();
  const [symptomes, setSymptomes] = useState("");
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [resultat, setResultat] = useState(null);

  useEffect(() => {
    if (open) {
      setResultat(null);
      setErreur(null);
      setSymptomes("");
    }
  }, [open]);

  if (!open) return null;

  const ajouterSymptomeRapide = (s) => {
    setSymptomes((prev) => (prev.trim() ? `${prev}, ${s}` : s));
  };

  const handleAnalyser = async () => {
    if (!symptomes.trim()) {
      setErreur("Veuillez decrire vos symptomes.");
      return;
    }
    try {
      setLoading(true);
      setErreur(null);
      const data = await analyserSymptomes(symptomes);
      setResultat(data);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVoirMedecins = () => {
    if (resultat?.specialite_recommandee) {
      navigate(`/annuaire?specialite=${encodeURIComponent(resultat.specialite_recommandee)}`);
    }
    onClose();
  };

  const urgenceConfig = {
    faible: { label: "Non urgent", color: "text-green-600 bg-green-50" },
    moyen: { label: "A consulter rapidement", color: "text-orange-600 bg-orange-50" },
    eleve: { label: "Consultez rapidement un medecin", color: "text-red-600 bg-red-50" },
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl
        ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>

        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b
          ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Trouver rapidement un médecin</h2>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Décrivez vos symptômes, on vous oriente
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {!resultat ? (
            <>
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Quels sont vos symptômes ?
                </label>
                <textarea
                  value={symptomes}
                  onChange={(e) => setSymptomes(e.target.value)}
                  rows={4}
                  placeholder="Ex: J'ai des maux de tete depuis 2 jours et de la fievre..."
                  className={`w-full p-3 rounded-xl border outline-none resize-none text-sm
                    ${darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200"}`}
                />
              </div>

              <div>
                <p className={`text-xs font-semibold mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Symptômes courants
                </p>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOMES_RAPIDES.map((s) => (
                    <button
                      key={s}
                      onClick={() => ajouterSymptomeRapide(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition
                        ${darkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {erreur && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm
                  ${darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"}`}>
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {erreur}
                </div>
              )}

              <div className={`flex items-start gap-2 p-3 rounded-xl text-xs
                ${darkMode ? "bg-blue-900/20 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <p>Ceci n'est pas un diagnostic médical. En cas d'urgence vitale, contactez immédiatement les services d'urgence.</p>
              </div>

              <button
                onClick={handleAnalyser}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {loading ? "Analyse en cours..." : "Analyser mes symptômes"}
              </button>
            </>
          ) : (
            <>
              {/* Resultat */}
              <div className={`p-5 rounded-2xl text-center ${darkMode ? "bg-blue-900/20" : "bg-blue-50"}`}>
                <Stethoscope size={32} className="mx-auto mb-3 text-blue-500" />
                <p className={`text-xs font-semibold uppercase mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Spécialité recommandée
                </p>
                <h3 className="text-xl font-bold text-blue-600">{resultat.specialite_recommandee}</h3>
                <p className={`text-sm mt-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {resultat.explication}
                </p>
                <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold
                  ${urgenceConfig[resultat.niveau_urgence]?.color || "text-gray-600 bg-gray-100"}`}>
                  {urgenceConfig[resultat.niveau_urgence]?.label}
                </span>
              </div>

              {resultat.medecins_disponibles?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-3">Médecins disponibles</p>
                  <div className="space-y-2">
                    {resultat.medecins_disponibles.map((m) => (
                      <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl
                        ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                        <div>
                          <p className="text-sm font-medium">{m.nom}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Star size={11} className="text-yellow-400 fill-yellow-400" />
                              {m.note.toFixed(1)}
                            </span>
                            {m.teleconsultation && (
                              <span className="flex items-center gap-1 text-xs text-blue-500">
                                <Video size={11} /> Vidéo
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-green-600">
                          {m.tarif.toLocaleString()} {m.devise}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleVoirMedecins}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                Voir tous les médecins en {resultat.specialite_recommandee}
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => setResultat(null)}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition
                  ${darkMode ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"}`}
              >
                Nouvelle recherche
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}