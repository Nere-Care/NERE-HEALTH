import { useState, useEffect } from "react";
import { X, Plus, Trash2, Save, AlertCircle, CheckCircle, Clock } from "lucide-react";
import {
  fetchMesDisponibilites,
  updateMesDisponibilites,
} from "../../../services/medecinService";

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const JOURS_LABELS = {
  lundi: "Lundi", mardi: "Mardi", mercredi: "Mercredi",
  jeudi: "Jeudi", vendredi: "Vendredi", samedi: "Samedi", dimanche: "Dimanche",
};
const DUREES = [15, 20, 30, 45, 60, 90];

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
      <AlertCircle size={11} className="flex-shrink-0" />
      {message}
    </p>
  );
}

const newDispo = () => ({
  _id: Date.now() + Math.random(),
  jour_semaine: "lundi",
  heure_debut: "09:00",
  heure_fin: "12:00",
  duree_creneau_minutes: 30,
  type: "presentiel",
  recurrence: "hebdomadaire",
});

export default function AvailabilityForm({ open, onClose, darkMode, onSave }) {
  const [disponibilites, setDisponibilites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [succes, setSucces] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [erreurs, setErreurs] = useState({});

  useEffect(() => {
    if (!open) return;
    const charger = async () => {
      try {
        setLoading(true);
        setServerError(null);
        setSucces(false);
        setErreurs({});
        const data = await fetchMesDisponibilites();
        if (data && data.length > 0) {
          setDisponibilites(data.map((d) => ({ ...d, _id: d.id || Date.now() + Math.random() })));
        } else {
          // Pré-remplir avec une entrée vide si aucune dispo
          setDisponibilites([newDispo()]);
        }
      } catch (err) {
        setServerError(err.message);
        setDisponibilites([newDispo()]);
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [open]);

  const updateDispo = (id, key, value) => {
    setDisponibilites((prev) =>
      prev.map((d) => d._id === id ? { ...d, [key]: value } : d)
    );
    // Effacer l'erreur du champ
    if (erreurs[`${id}_${key}`]) {
      setErreurs((prev) => { const e = { ...prev }; delete e[`${id}_${key}`]; return e; });
    }
  };

  const ajouterDispo = () => setDisponibilites((prev) => [...prev, newDispo()]);

  const supprimerDispo = (id) => {
    if (disponibilites.length <= 1) {
      setServerError("Vous devez avoir au moins une disponibilite.");
      return;
    }
    setDisponibilites((prev) => prev.filter((d) => d._id !== id));
  };

  const valider = () => {
    const errs = {};
    disponibilites.forEach((d) => {
      if (!d.jour_semaine) {
        errs[`${d._id}_jour_semaine`] = "Jour obligatoire";
      }
      if (!d.heure_debut) {
        errs[`${d._id}_heure_debut`] = "Heure de debut obligatoire";
      }
      if (!d.heure_fin) {
        errs[`${d._id}_heure_fin`] = "Heure de fin obligatoire";
      }
      if (d.heure_debut && d.heure_fin && d.heure_debut >= d.heure_fin) {
        errs[`${d._id}_heure_fin`] = "L'heure de fin doit etre apres l'heure de debut";
      }
      // Vérifier chevauchement sur même jour
      const memeJour = disponibilites.filter(
        (other) => other._id !== d._id && other.jour_semaine === d.jour_semaine
      );
      for (const other of memeJour) {
        if (d.heure_debut < other.heure_fin && d.heure_fin > other.heure_debut) {
          errs[`${d._id}_heure_debut`] = "Chevauchement avec une autre plage du meme jour";
        }
      }
    });
    setErreurs(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!valider()) return;
    try {
      setSaving(true);
      setServerError(null);

      const payload = disponibilites.map((d) => ({
        jour_semaine: d.jour_semaine,
        heure_debut: d.heure_debut,
        heure_fin: d.heure_fin,
        duree_creneau_minutes: Number(d.duree_creneau_minutes) || 30,
        type: d.type, // Assure-toi que c'est "presentiel" ou "video" (sans accent)
        recurrence: d.recurrence || "hebdomadaire",
      }));

      // ✅ AJOUTE CETTE LIGNE ICI :
      console.log("🚀 DONNÉES ENVOYÉES AU BACKEND:", JSON.stringify({ disponibilites: payload }, null, 2));

      await updateMesDisponibilites(payload);
      setSucces(true);
      onSave?.(payload);
      setTimeout(() => {
        setSucces(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("❌ ERREUR DÉTAILLÉE:", err.message); // <-- Affichera l'erreur précise de FastAPI
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const inputClass = `px-3 py-2 rounded-lg border outline-none text-sm transition w-full
    ${darkMode
      ? "bg-gray-800 border-gray-600 text-white"
      : "bg-white border-gray-300 text-gray-800"}`;

  const selectClass = `px-3 py-2 rounded-lg border outline-none text-sm transition
    ${darkMode
      ? "bg-gray-800 border-gray-600 text-white"
      : "bg-white border-gray-300 text-gray-800"}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className={`w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden
        ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>

        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b flex-shrink-0
          ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Clock size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Mes disponibilités</h2>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Définissez vos plages horaires de consultation
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}>
            <X size={20} />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {succes && (
            <div className="flex items-center justify-center gap-2 py-6 text-green-500 font-semibold">
              <CheckCircle size={22} />
              Disponibilités sauvegardées avec succès !
            </div>
          )}

          {serverError && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm
              ${darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"}`}>
              <AlertCircle size={16} className="flex-shrink-0" />
              {serverError}
            </div>
          )}

          {!loading && !succes && (
            <>
              {/* Info */}
              <div className={`flex items-start gap-3 p-3 rounded-xl text-xs
                ${darkMode ? "bg-blue-900/20 border border-blue-800 text-blue-300" : "bg-blue-50 border border-blue-200 text-blue-700"}`}>
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <p>
                  Définissez vos plages de disponibilité hebdomadaires. Les patients pourront prendre
                  rendez-vous uniquement sur ces créneaux. La sauvegarde remplace toutes les disponibilités existantes.
                </p>
              </div>

              {/* Liste des disponibilités */}
              <div className="space-y-4">
                {disponibilites.map((dispo, index) => (
                  <div key={dispo._id}
                    className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>

                    {/* En-tête de la ligne */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full
                        ${darkMode ? "bg-gray-700 text-gray-300" : "bg-white text-gray-600 border border-gray-200"}`}>
                        Plage {index + 1}
                      </span>
                      <button onClick={() => supprimerDispo(dispo._id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition">
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Jour */}
                    <div className="mb-3">
                      <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Jour
                      </label>
                      <select
                        value={dispo.jour_semaine}
                        onChange={(e) => updateDispo(dispo._id, "jour_semaine", e.target.value)}
                        className={`${selectClass} w-full`}
                      >
                        {JOURS.map((j) => (
                          <option key={j} value={j}>{JOURS_LABELS[j]}</option>
                        ))}
                      </select>
                      <FieldError message={erreurs[`${dispo._id}_jour_semaine`]} />
                    </div>

                    {/* Heures */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Heure de début
                        </label>
                        <input
                          type="time"
                          value={dispo.heure_debut}
                          onChange={(e) => updateDispo(dispo._id, "heure_debut", e.target.value)}
                          className={inputClass}
                        />
                        <FieldError message={erreurs[`${dispo._id}_heure_debut`]} />
                      </div>
                      <div>
                        <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Heure de fin
                        </label>
                        <input
                          type="time"
                          value={dispo.heure_fin}
                          onChange={(e) => updateDispo(dispo._id, "heure_fin", e.target.value)}
                          className={inputClass}
                        />
                        <FieldError message={erreurs[`${dispo._id}_heure_fin`]} />
                      </div>
                    </div>

                    {/* Durée créneau + Type */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Durée par créneau
                        </label>
                        <select
                          value={dispo.duree_creneau_minutes}
                          onChange={(e) => updateDispo(dispo._id, "duree_creneau_minutes", Number(e.target.value))}
                          className={`${selectClass} w-full`}
                        >
                          {DUREES.map((d) => (
                            <option key={d} value={d}>{d} min</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Mode
                        </label>
                        <select
                          value={dispo.type}
                          onChange={(e) => updateDispo(dispo._id, "type", e.target.value)}
                          className={`${selectClass} w-full`}
                        >
                          <option value="presentiel">Présentiel</option>
                          <option value="video">Vidéo</option>
                        </select>
                      </div>
                    </div>

                    {/* Aperçu du nombre de créneaux */}
                    {dispo.heure_debut && dispo.heure_fin && dispo.heure_debut < dispo.heure_fin && (
                      <div className={`mt-3 text-xs px-3 py-1.5 rounded-lg
                        ${darkMode ? "bg-gray-700 text-gray-300" : "bg-white text-gray-500 border border-gray-200"}`}>
                        {(() => {
                          const [hD, mD] = dispo.heure_debut.split(":").map(Number);
                          const [hF, mF] = dispo.heure_fin.split(":").map(Number);
                          const totalMin = (hF * 60 + mF) - (hD * 60 + mD);
                          const nb = Math.floor(totalMin / dispo.duree_creneau_minutes);
                          return `${nb} créneau${nb > 1 ? "x" : ""} de ${dispo.duree_creneau_minutes} min`;
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bouton ajouter */}
              <button
                onClick={ajouterDispo}
                className={`w-full py-3 rounded-xl border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 transition
                  ${darkMode
                    ? "border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400"
                    : "border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500"
                  }`}
              >
                <Plus size={16} />
                Ajouter une plage
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !succes && (
          <div className={`sticky bottom-0 flex gap-3 px-6 py-4 border-t flex-shrink-0
            ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}>
            <button onClick={onClose}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition
                ${darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <Save size={16} />
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}