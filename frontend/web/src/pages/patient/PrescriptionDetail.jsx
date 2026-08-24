import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Pill, Calendar, Clock, User, AlertTriangle, Loader, FileText, Building, Stethoscope, Trash2, Activity, CheckCircle, XCircle, PlayCircle
} from "lucide-react";
import { get, del, put } from "../../services/apiClient";
import { getUserTimezone } from "../../utils/timezone";

const TYPE_LABELS = {
  consultation_generale: "Consultation générale",
  consultation_specialiste: "Spécialiste",
  suivi: "Suivi",
  urgence: "Urgence",
  teleconsultation: "Téléconsultation",
};

const STATUT_TRAITEMENT_LABELS = {
  EN_COURS: { label: "En cours", color: "bg-blue-100 text-blue-700", icon: PlayCircle },
  TERMINE: { label: "Terminé", color: "bg-green-100 text-green-700", icon: CheckCircle },
  ARRETE: { label: "Arrêté", color: "bg-red-100 text-red-700", icon: XCircle },
};

const MOTIFS_ARRET = [
  "Guérison",
  "Allergie / Effet secondaire",
  "Changement de traitement",
  "Amélioration de l'état",
  "Fin de prescription",
  "Autre",
];

export default function PrescriptionDetail({ darkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [ordonnance, setOrdonnance] = useState(null);
  const [progression, setProgression] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showStatutForm, setShowStatutForm] = useState(false);
  const [savingStatut, setSavingStatut] = useState(false);
  const [formStatut, setFormStatut] = useState({
    statut_traitement: "EN_COURS",
    date_debut_traitement: "",
    date_arret_traitement: "",
    motif_arret_traitement: "",
  });

  useEffect(() => {
    if (!id) return;
    Promise.all([
      get(`/api/ordonnances/${id}`),
      get(`/api/ordonnances/${id}/progression`).catch(() => null),
    ])
      .then(([ordoData, progData]) => {
        setOrdonnance(ordoData);
        setProgression(progData);
        setFormStatut({
          statut_traitement: ordoData.statut_traitement || "EN_COURS",
          date_debut_traitement: ordoData.date_debut_traitement || "",
          date_arret_traitement: ordoData.date_arret_traitement || "",
          motif_arret_traitement: ordoData.motif_arret_traitement || "",
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Supprimer cette ordonnance ?")) return;
    setDeleting(true);
    try {
      await del(`/api/ordonnances/${id}`);
      navigate(-1);
    } catch (e) {
      console.error("Erreur suppression", e);
      setDeleting(false);
    }
  };

  const handleSaveStatut = async () => {
    setSavingStatut(true);
    try {
      const payload = {
        statut_traitement: formStatut.statut_traitement,
      };
      if (formStatut.date_debut_traitement) payload.date_debut_traitement = formStatut.date_debut_traitement;
      if (formStatut.statut_traitement === "ARRETE") {
        if (formStatut.date_arret_traitement) payload.date_arret_traitement = formStatut.date_arret_traitement;
        if (formStatut.motif_arret_traitement) payload.motif_arret_traitement = formStatut.motif_arret_traitement;
      }
      const updated = await put(`/api/ordonnances/${id}/statut-traitement`, payload);
      setOrdonnance(updated);
      setShowStatutForm(false);
      get(`/api/ordonnances/${id}/progression`)
        .then(setProgression)
        .catch(() => {});
    } catch (e) {
      console.error("Erreur mise à jour statut", e);
    } finally {
      setSavingStatut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!ordonnance) {
    return <div className={`p-6 ${darkMode ? "text-white" : ""}`}>Ordonnance introuvable</div>;
  }

  const prescripteur = ordonnance.medecin_nom_libre || "Médecin non précisé";
  const prog = progression;
  const couleurTraitement = prog?.couleur || (ordonnance.statut_traitement === "TERMINE" ? "vert" : "rouge");
  const barColor = couleurTraitement === "vert"
    ? "bg-green-500"
    : ordonnance.statut_traitement === "ARRETE"
      ? "bg-red-500"
      : "bg-red-400";
  const statutBadge = prog?.statut || ordonnance.statut_traitement;
  const statutInfo = STATUT_TRAITEMENT_LABELS[statutBadge] || null;
  const StatutIcon = statutInfo?.icon || Activity;

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>
      <button onClick={() => navigate(-1)}
        className={`flex items-center gap-2 mb-6 text-sm font-medium ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-blue-500"}`}>
        <ArrowLeft size={18} /> Retour
      </button>

      <div className={`rounded-3xl shadow-lg p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-blue-100 text-blue-500">
              <Pill size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Ordonnance</h1>
              <p className="text-gray-400 mt-1">{ordonnance.numero}</p>
              {(() => {
                const pb = ordonnance.instructions_speciales && ordonnance.instructions_speciales.startsWith("[Pour ")
                  ? ordonnance.instructions_speciales.match(/^\[Pour\s+([^\]]+)\]/i)?.[1]?.trim()
                  : null;
                return pb ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300 px-2.5 py-1 rounded-lg mt-1">
                    <User size={12} /> Pour le proche : {pb}
                  </span>
                ) : null;
              })()}
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              deleting ? "bg-gray-300 text-gray-500 cursor-wait" : "bg-red-100 text-red-600 hover:bg-red-200"
            }`}
          >
            <Trash2 size={16} />
            {deleting ? "Suppression..." : "Supprimer"}
          </button>
        </div>

        {/* Suivi traitement */}
        <div className={`rounded-2xl p-5 mb-6 border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200 shadow-sm"}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={18} className={couleurTraitement === "vert" ? "text-green-500" : "text-red-500"} />
              <h2 className="font-bold">Suivi du traitement</h2>
            </div>
            <button
              onClick={() => setShowStatutForm(!showStatutForm)}
              className={`text-xs font-medium px-3 py-1.5 rounded-xl transition ${darkMode ? "text-blue-400 hover:bg-gray-600" : "text-blue-600 hover:bg-blue-50"}`}
            >
              {showStatutForm ? "Annuler" : "Modifier le statut"}
            </button>
          </div>

          {statutInfo ? (
            <div className="flex items-center gap-3 mb-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statutInfo.color}`}>
                <StatutIcon size={12} /> {statutInfo.label}
              </span>
              {ordonnance.date_debut_traitement && (
                <span className="text-xs text-gray-400">
                  Début : {new Date(ordonnance.date_debut_traitement).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() })}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mb-3">Statut non défini</p>
          )}

          {/* Barre de progression */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Avancement
              </span>
              <span className={`text-xs font-bold ${couleurTraitement === "vert" ? "text-green-500" : "text-red-500"}`}>
                {prog?.jours_effectues ?? 0}j / {prog?.duree_totale ?? 0}j
              </span>
            </div>
            <div className={`h-3 rounded-full overflow-hidden ${darkMode ? "bg-gray-600" : "bg-gray-200"}`}>
              <div
                className={`h-3 rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${prog?.pourcentage ?? 0}%` }}
              />
            </div>
          </div>

          {/* Détails progression */}
          {prog && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className={`rounded-xl p-2.5 text-center ${darkMode ? "bg-gray-600" : "bg-blue-50"}`}>
                <p className={`text-lg font-bold ${couleurTraitement === "vert" ? "text-green-500" : "text-blue-500"}`}>
                  {prog.jours_effectues}
                </p>
                <p className={`text-[10px] font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Jours effectués
                </p>
              </div>
              <div className={`rounded-xl p-2.5 text-center ${darkMode ? "bg-gray-600" : "bg-orange-50"}`}>
                <p className={`text-lg font-bold ${prog.jours_restants === 0 ? "text-green-500" : "text-orange-500"}`}>
                  {prog.jours_restants}
                </p>
                <p className={`text-[10px] font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Jours restants
                </p>
              </div>
              <div className={`rounded-xl p-2.5 text-center ${darkMode ? "bg-gray-600" : "bg-gray-100"}`}>
                <p className="text-lg font-bold text-gray-400">{prog.duree_totale}</p>
                <p className={`text-[10px] font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Durée totale
                </p>
              </div>
            </div>
          )}

          {prog && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className={`rounded-xl p-2.5 text-center ${darkMode ? "bg-gray-600" : "bg-green-50"}`}>
                <p className="text-lg font-bold text-green-500">{prog.total_prises_effectuees}</p>
                <p className={`text-[10px] font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Prises effectuées
                </p>
              </div>
              <div className={`rounded-xl p-2.5 text-center ${darkMode ? "bg-gray-600" : "bg-gray-100"}`}>
                <p className={`text-lg font-bold ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                  {prog.total_prises_prevues}
                </p>
                <p className={`text-[10px] font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Prises prévues
                </p>
              </div>
              <div className={`rounded-xl p-2.5 text-center ${darkMode ? "bg-gray-600" : "bg-red-50"}`}>
                <p className={`text-lg font-bold ${prog.total_prises_oubliees > 0 ? "text-red-500" : "text-gray-400"}`}>
                  {prog.total_prises_oubliees}
                </p>
                <p className={`text-[10px] font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Oubliées
                </p>
              </div>
            </div>
          )}

          {prog?.prochaine_prise && (
            <div className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? "bg-blue-900/30" : "bg-blue-50"}`}>
              <Clock size={16} className="text-blue-500 flex-shrink-0" />
              <div>
                <p className={`text-xs font-semibold ${darkMode ? "text-blue-300" : "text-blue-700"}`}>
                  Prochaine prise : {prog.prochaine_prise.medicament_nom}
                </p>
                <p className={`text-[10px] ${darkMode ? "text-blue-400" : "text-blue-500"}`}>
                  {new Date(prog.prochaine_prise.date_prise_prevue).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() })}
                  {prog.prochaine_prise.heure_prise_prevue && ` à ${prog.prochaine_prise.heure_prise_prevue}`}
                  {" · "}{prog.prochaine_prise.moment_journee}
                </p>
              </div>
            </div>
          )}

          {ordonnance.statut_traitement === "ARRETE" && ordonnance.date_arret_traitement && (
            <div className={`text-xs mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Arrêté le {new Date(ordonnance.date_arret_traitement).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() })}
              {ordonnance.motif_arret_traitement && ` — ${ordonnance.motif_arret_traitement}`}
            </div>
          )}

          {showStatutForm && (
            <div className={`mt-4 pt-4 border-t space-y-3 ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Statut</label>
                  <select
                    value={formStatut.statut_traitement}
                    onChange={(e) => setFormStatut(f => ({ ...f, statut_traitement: e.target.value }))}
                    className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "border-gray-200 text-gray-800"}`}
                  >
                    <option value="EN_COURS">En cours</option>
                    <option value="TERMINE">Terminé</option>
                    <option value="ARRETE">Arrêté</option>
                  </select>
                </div>
                <div>
                  <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Date début</label>
                  <input
                    type="date"
                    value={formStatut.date_debut_traitement}
                    onChange={(e) => setFormStatut(f => ({ ...f, date_debut_traitement: e.target.value }))}
                    className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "border-gray-200 text-gray-800"}`}
                  />
                </div>
                {formStatut.statut_traitement === "ARRETE" && (
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Date d'arrêt</label>
                    <input
                      type="date"
                      value={formStatut.date_arret_traitement}
                      onChange={(e) => setFormStatut(f => ({ ...f, date_arret_traitement: e.target.value }))}
                      className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "border-gray-200 text-gray-800"}`}
                    />
                  </div>
                )}
              </div>

              {formStatut.statut_traitement === "ARRETE" && (
                <div>
                  <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Motif de l'arrêt</label>
                  <select
                    value={formStatut.motif_arret_traitement}
                    onChange={(e) => setFormStatut(f => ({ ...f, motif_arret_traitement: e.target.value }))}
                    className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "border-gray-200 text-gray-800"}`}
                  >
                    <option value="">Sélectionner un motif...</option>
                    {MOTIFS_ARRET.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}

              {formStatut.statut_traitement === "TERMINE" && prog?.total_prises_oubliees > 0 && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-xs ${darkMode ? "bg-yellow-900/30 text-yellow-300" : "bg-yellow-50 text-yellow-700"}`}>
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  <span>Attention : {prog.total_prises_oubliees} prise{prog.total_prises_oubliees > 1 ? 's' : ''} oubliée{prog.total_prises_oubliees > 1 ? 's' : ''} sur ce traitement.</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleSaveStatut}
                  disabled={savingStatut}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {savingStatut ? "Sauvegarde..." : "Enregistrer"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Infos générales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className={`rounded-2xl p-5 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            <div className="flex items-center gap-2 mb-3">
              <User size={18} className="text-green-500" />
              <h2 className="font-bold">Prescrit par</h2>
            </div>
            <p className="text-sm font-semibold">{prescripteur}</p>
          </div>

          {ordonnance.motif && (
            <div className={`rounded-2xl p-5 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope size={18} className="text-teal-500" />
                <h2 className="font-bold">Motif</h2>
              </div>
              <p className="text-sm">{ordonnance.motif}</p>
            </div>
          )}

          {ordonnance.type_consultation && (
            <div className={`rounded-2xl p-5 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={18} className="text-indigo-500" />
                <h2 className="font-bold">Type</h2>
              </div>
              <p className="text-sm">{TYPE_LABELS[ordonnance.type_consultation] || ordonnance.type_consultation}</p>
            </div>
          )}

          {ordonnance.structure_nom && (
            <div className={`rounded-2xl p-5 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <div className="flex items-center gap-2 mb-3">
                <Building size={18} className="text-orange-500" />
                <h2 className="font-bold">Structure sanitaire</h2>
              </div>
              <p className="text-sm font-medium">{ordonnance.structure_nom}</p>
              {ordonnance.adresse_structure && (
                <p className="text-xs text-gray-400 mt-1">{ordonnance.adresse_structure}</p>
              )}
            </div>
          )}

          <div className={`rounded-2xl p-5 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={18} className="text-orange-500" />
              <h2 className="font-bold">Période</h2>
            </div>
            {ordonnance.date_debut_traitement && (
              <p className="text-sm">Début : {new Date(ordonnance.date_debut_traitement).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() })}</p>
            )}
            {ordonnance.date_expiration && (
              <p className="text-sm">Expiration : {new Date(ordonnance.date_expiration).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() })}</p>
            )}
            {!ordonnance.date_debut_traitement && !ordonnance.date_expiration && (
              <p className="text-sm text-gray-400">Non renseignée</p>
            )}
          </div>
        </div>

        {/* Médicaments */}
        <h3 className={`font-bold text-lg mb-3 ${darkMode ? "text-white" : "text-gray-800"}`}>
          Médicaments prescrits ({ordonnance.lignes?.length || 0})
        </h3>
        {ordonnance.lignes?.map((ligne, i) => (
          <div key={ligne.id || i} className={`mb-4 rounded-2xl p-5 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={18} className="text-blue-500" />
              <h2 className="font-bold">{ligne.medicament_nom} — {ligne.dosage}</h2>
              {ligne.forme && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? "bg-gray-600 text-gray-300" : "bg-gray-200 text-gray-600"}`}>
                  {ligne.forme}
                </span>
              )}
            </div>
            <p className="text-sm">{ligne.posologie || `${ligne.frequence_par_jour}x/jour`}</p>
            <p className="text-sm mt-2 text-gray-400">{ligne.duree_jours} jours · {ligne.quantite} boîte(s)</p>
            {ligne.instructions_speciales && (
              <p className="text-sm mt-2 text-yellow-500">{ligne.instructions_speciales}</p>
            )}
            {ligne.heure_prise?.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {ligne.heure_prise.map((h, j) => (
                  <span key={j} className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">{h}</span>
                ))}
              </div>
            )}
          </div>
        ))}

        {ordonnance.notes_medecin && (
          <div className={`mt-5 rounded-2xl p-4 flex items-center gap-3 ${darkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-600"}`}>
            <AlertTriangle size={20} />
            <p className="text-sm font-medium">{ordonnance.notes_medecin}</p>
          </div>
        )}
      </div>
    </div>
  );
}
