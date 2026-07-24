import { useState, useEffect } from "react";
import { X, Trash2, Plus, Calendar, Clock, Loader2 } from "lucide-react";

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return { value: `${h}:${m}`, label: `${h}:${m}` };
});

function TimeSelect({ value, onChange, darkMode, placeholder, disabled }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          darkMode
            ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-750"
            : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
        }`}
      >
        <option value="">{placeholder}</option>
        {timeOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
        <Clock className="w-4 h-4" />
      </div>
    </div>
  );
}

const WEEKDAY_NAMES = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

const getFrenchWeekday = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return WEEKDAY_NAMES[date.getDay()];
};

/**
 * Calcule la date réelle d'affichage d'un créneau "unique".
 * Un créneau unique (dateDebut=X, jour_semaine=Y) s'affiche le premier
 * jour Y à partir de X (dans une fenêtre de 7 jours max).
 */
const getEffectiveDateForUniqueSlot = (dateDebut, jourSemaine) => {
  if (!dateDebut || !jourSemaine) return dateDebut;
  const targetWeekday = WEEKDAY_NAMES.indexOf(jourSemaine.toLowerCase());
  if (targetWeekday === -1) return dateDebut;
  const start = new Date(dateDebut + "T00:00:00");
  for (let i = 0; i < 7; i++) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + i);
    if (candidate.getDay() === targetWeekday) {
      const y = candidate.getFullYear();
      const m = String(candidate.getMonth() + 1).padStart(2, "0");
      const d = String(candidate.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  return dateDebut;
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Vérifie si une disponibilité est active pour une date donnée.
 * Tient compte des exceptions (indisponible / horaires_personnalises).
 */
function isSlotActiveOnDate(slot, targetDateStr, exceptions = []) {
  if (!slot.status || slot.status === "unavailable") return false;
  if (!slot.startTime || !slot.day) return false;

  const exception = exceptions.find(
    (ex) => ex.date === targetDateStr && ex.actif !== false
  );
  if (exception) {
    if (exception.type === "indisponible") return false;
    if (exception.type === "horaires_personnalises") {
      const inCustom = (exception.creneaux || []).some(
        (cr) => cr.start && cr.end && slot.startTime >= cr.start && slot.endTime <= cr.end
      );
      return inCustom;
    }
  }

  const slotDayLower = (slot.day || "").toLowerCase();
  const targetDayLower = getFrenchWeekday(targetDateStr);
  if (slotDayLower !== targetDayLower) return false;

  if (slot.dateDebut && targetDateStr < slot.dateDebut) return false;
  if (slot.dateFin && targetDateStr > slot.dateFin) return false;

  if (slot.recurrence === "unique") {
    if (!slot.dateDebut) return false;
    if (targetDateStr < slot.dateDebut) return false;
    const effective = getEffectiveDateForUniqueSlot(slot.dateDebut, slot.day);
    if (effective !== targetDateStr) return false;
  } else if (slot.recurrence === "bi_mensuel") {
    if (!slot.dateDebut) return false;
    const debut = new Date(slot.dateDebut + "T00:00:00");
    const target = new Date(targetDateStr + "T00:00:00");
    const diffMs = target.getTime() - debut.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    if (diffWeeks < 0 || diffWeeks % 2 !== 0) return false;
  } else if (slot.recurrence === "mensuel") {
    if (!slot.dateDebut) return false;
    const debut = new Date(slot.dateDebut + "T00:00:00");
    const target = new Date(targetDateStr + "T00:00:00");
    if (target.getDate() !== debut.getDate()) return false;
  }

  return true;
}

export default function SlotFormModal({
  open,
  onClose,
  selectedSlot,
  selectedDate,
  darkMode,
  onSave,
  onDelete,
  onAddNew,
  existingAvailabilities = [],
  exceptions = [],
}) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [recurrence, setRecurrence] = useState("unique");
  const [dateFin, setDateFin] = useState("");
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Date effective d'affichage du créneau sur le calendrier
  const activeDateStr = selectedSlot
    ? getEffectiveDateForUniqueSlot(
        selectedSlot.dateDebut || selectedDate,
        selectedSlot.day || getFrenchWeekday(selectedSlot.dateDebut || selectedDate)
      )
    : selectedDate;

  const dayName = getFrenchWeekday(activeDateStr);

  useEffect(() => {
    if (open) {
      if (selectedSlot) {
        setStartTime(selectedSlot.startTime || "");
        setEndTime(selectedSlot.endTime || "");
        setRecurrence(selectedSlot.recurrence || "unique");
        setDateFin(selectedSlot.dateFin || "");
      } else {
        setStartTime("");
        setEndTime("");
        setRecurrence("unique");
        setDateFin("");
      }
      setError("");
      setApiError("");
      setSaving(false);
      setDeleting(false);
    }
  }, [open, selectedSlot, selectedDate]);

  if (!open) return null;

  const toMinutes = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const validateAndGetError = () => {
    if (!startTime || !endTime) {
      return "Veuillez sélectionner l'heure de début et de fin.";
    }

    const sNew = toMinutes(startTime);
    const eNew = toMinutes(endTime);

    if (sNew >= eNew) {
      return "L'heure de début doit être strictement inférieure à l'heure de fin.";
    }

    const activeSlots = existingAvailabilities.filter(
      (s) => isSlotActiveOnDate(s, activeDateStr, exceptions)
    );

    for (const slot of activeSlots) {
      if (selectedSlot && slot.id === selectedSlot.id) continue;
      if (slot.status === "unavailable") continue;

      const sExist = toMinutes(slot.startTime);
      const eExist = toMinutes(slot.endTime);
      const timesOverlap = sNew < eExist && sExist < eNew;
      if (!timesOverlap) continue;

      return `Ce créneau chevauche une disponibilité existante le ${capitalize(dayName)} de ${slot.startTime} à ${slot.endTime}.`;
    }

    return null;
  };

  const handleValidationAndSave = async (e) => {
    e.preventDefault();
    setError("");
    setApiError("");

    const validationError = validateAndGetError();
    if (validationError) {
      setError(validationError);
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];

    setSaving(true);
    try {
      await onSave({
        id: selectedSlot?.id,
        day: dayName,
        startTime,
        endTime,
        recurrence,
        dateDebut: activeDateStr || todayStr,
        dateFin: recurrence === "hebdomadaire" ? dateFin || null : null,
      });
      onClose();
    } catch (err) {
      setApiError(
        err?.message || "Une erreur est survenue lors de l'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSlot?.id) return;
    setDeleting(true);
    try {
      await onDelete(selectedSlot.id);
      onClose();
    } catch (err) {
      setApiError(err?.message || "Une erreur est survenue lors de la suppression.");
      setDeleting(false);
    }
  };

  const btnBase = (active) =>
    active
      ? "bg-blue-600 text-white border-blue-600"
      : darkMode
      ? "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750"
      : "bg-white text-gray-750 border-gray-200 hover:bg-gray-50";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className={`w-full sm:max-w-md max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl transition-colors duration-200 ${
          darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        }`}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-blue-500">
              {selectedSlot ? "Modifier le créneau" : "Ajouter un créneau"}
            </h2>
            <p className={`text-xs sm:text-sm mt-1 flex items-center gap-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              <Calendar className="w-3.5 h-3.5" />
              {capitalize(dayName)} {formatDateDisplay(activeDateStr)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving || deleting}
            className={`p-2 rounded-xl transition disabled:opacity-50 ${
              darkMode ? "hover:bg-gray-800 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-black"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ERREUR VALIDATION */}
        {error && (
          <div className="p-3 mb-4 rounded-xl text-xs sm:text-sm bg-red-500/10 text-red-500 border border-red-500/20 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* ERREUR API */}
        {apiError && (
          <div className="p-3 mb-4 rounded-xl text-xs sm:text-sm bg-red-600/10 text-red-600 border border-red-600/20 font-medium">
            ❌ {apiError}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleValidationAndSave} className="space-y-5">
          {/* HORAIRES */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-70">
              Horaires du créneau
            </label>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <span className="text-[10px] opacity-60 mb-1 block">Début</span>
                <TimeSelect
                  value={startTime}
                  onChange={setStartTime}
                  darkMode={darkMode}
                  placeholder="Début"
                  disabled={saving || deleting}
                />
              </div>
              <div>
                <span className="text-[10px] opacity-60 mb-1 block">Fin</span>
                <TimeSelect
                  value={endTime}
                  onChange={setEndTime}
                  darkMode={darkMode}
                  placeholder="Fin"
                  disabled={saving || deleting}
                />
              </div>
            </div>
          </div>

          {/* RECURRENCE */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-70">
              Récurrence
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "unique", label: "Unique" },
                { value: "quotidien", label: "Quotidien" },
                { value: "hebdomadaire", label: "Hebdomadaire" },
                { value: "bi_mensuel", label: "Bi-mensuel" },
                { value: "mensuel", label: "Mensuel" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  disabled={saving || deleting}
                  onClick={() => setRecurrence(value)}
                  className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition disabled:opacity-50 ${btnBase(recurrence === value)}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* DATE FIN (RÉCURRENCE) */}
          {recurrence !== "unique" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold opacity-75">
                Date de fin de validité (Optionnelle)
              </label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                disabled={saving || deleting}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none disabled:opacity-50 ${
                  darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>
          )}

          {/* ACTIONS */}
          {selectedSlot && onAddNew && (
            <button
              type="button"
              onClick={() => {
                onAddNew(activeDateStr);
              }}
              disabled={saving || deleting}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition disabled:opacity-50 ${
                darkMode
                  ? "border-blue-500/30 text-blue-400 bg-blue-500/5 hover:bg-blue-500/10"
                  : "border-blue-500/30 text-blue-600 bg-blue-50 hover:bg-blue-100"
              }`}
            >
              <Plus className="w-4 h-4" />
              Ajouter un créneau
            </button>
          )}
          <div className="flex gap-3 pt-3">
            {selectedSlot && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving || deleting}
                className="px-4 py-2.5 rounded-xl border border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500/10 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span className="text-xs sm:text-sm font-semibold">
                  {deleting ? "Suppression..." : "Supprimer"}
                </span>
              </button>
            )}
            <button
              type="submit"
              disabled={saving || deleting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/15 transition flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
