import { useState, useEffect } from "react";
import { X, Check, Plus, Trash2, Copy, Edit3, Calendar } from "lucide-react";

const weekDays = [
  "Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche",
];

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return { value: `${h}:${m}`, label: `${h}:${m}` };
});

function TimeSelect({ value, onChange, darkMode, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none appearance-none ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`}
    >
      <option value="">{placeholder}</option>
      {timeOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

const DAY_MAP = { "Lundi":"lundi","Mardi":"mardi","Mercredi":"mercredi","Jeudi":"jeudi","Vendredi":"vendredi","Samedi":"samedi","Dimanche":"dimanche" };

const SLOT_MIN_MS = 30 * 60 * 1000;

function localDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSlotVisible(availability, targetDate, exceptions = []) {
  if (!availability.status || availability.status === "unavailable") return false;
  if (!availability.startTime) return false;

  const targetStr = localDateStr(targetDate);

  const exception = exceptions.find(
    (ex) => ex.date === targetStr && ex.actif !== false
  );
  if (exception) {
    if (exception.type === "indisponible") return false;
    if (exception.type === "horaires_personnalises") {
      const inCustom = (exception.creneaux || []).some(
        (cr) => cr.start && cr.end && availability.startTime >= cr.start && availability.endTime <= cr.end
      );
      return inCustom;
    }
  }

  const targetWeekday = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"][targetDate.getDay()];

  if (availability.day !== targetWeekday) return false;

  if (availability.dateDebut && targetStr < availability.dateDebut) return false;
  if (availability.dateFin && targetStr > availability.dateFin) return false;

  if (availability.recurrence === "unique") {
    if (!availability.dateDebut) return false;
    if (targetStr < availability.dateDebut) return false;
    const debut = new Date(availability.dateDebut + "T00:00:00");
    const diffDays = Math.round((targetDate.getTime() - debut.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays < 0 || diffDays >= 7) return false;
  } else if (availability.recurrence === "bi_mensuel") {
    if (!availability.dateDebut) return false;
    const debut = new Date(availability.dateDebut + "T00:00:00");
    const diffMs = targetDate.getTime() - debut.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    if (diffWeeks < 0 || diffWeeks % 2 !== 0) return false;
  } else if (availability.recurrence === "mensuel") {
    if (!availability.dateDebut) return false;
    const debut = new Date(availability.dateDebut + "T00:00:00");
    if (targetDate.getDate() !== debut.getDate()) return false;
  }

  const now = new Date();
  const isToday = targetStr === localDateStr(now);
  if (isToday) {
    const [h, m] = availability.startTime.split(":").map(Number);
    const slotStart = new Date(now);
    slotStart.setHours(h, m, 0, 0);
    if (slotStart.getTime() - now.getTime() < SLOT_MIN_MS) return false;
  }

  return true;
}

export default function AvailabilityForm({
  open, onClose, darkMode, onSave,
  exceptions = [], onAddException, onUpdateException, onDeleteException,
  existingAvailabilities = [],
  onDeleteAvailability,
}) {
  const [selectedDays, setSelectedDays] = useState([]);
  const [slots, setSlots] = useState({});
  const [copySource, setCopySource] = useState(null);
  const [copyTargets, setCopyTargets] = useState([]);
  const [dayErrors, setDayErrors] = useState({});
  const [repeatMode, setRepeatMode] = useState("none");
  const [repeatEndDate, setRepeatEndDate] = useState("");

  const [excFormOpen, setExcFormOpen] = useState(false);
  const [editingExc, setEditingExc] = useState(null);
  const [excDate, setExcDate] = useState("");
  const [excType, setExcType] = useState("indisponible");
  const [excSlots, setExcSlots] = useState([{ start: "", end: "" }]);
  const [excError, setExcError] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedDays([]);
      setSlots({});
      setDayErrors({});
      setRepeatMode("none");
      setRepeatEndDate("");
      setCopySource(null);
      setCopyTargets([]);
      setExcFormOpen(false);
      setEditingExc(null);
      setExcError("");
    }
  }, [open]);

  useEffect(() => {
    const errs = {};
    for (const day of selectedDays) {
      const daySlots = slots[day] || [];
      const errors = [];
      const filled = daySlots.filter((s) => s.start && s.end);

      const persisted = existingAvailabilities
        .filter((a) => a.day === day && a.actif !== false)
        .map((a) => ({ start: a.startTime, end: a.endTime, persisted: true }));

      // Fusionner locaux + persistés pour la détection de chevauchement
      const all = [
        ...filled.map((s, i) => ({ ...s, label: `Créneau ${i + 1}` })),
        ...persisted.map((s) => ({ ...s, label: "Existant" })),
      ];

      for (let i = 0; i < all.length; i++) {
        if (all[i].start >= all[i].end) {
          if (!all[i].persisted) {
            errors.push(`Créneau ${filled.indexOf(all[i]) + 1} : le début doit être avant la fin`);
          }
        }
        for (let j = i + 1; j < all.length; j++) {
          if (all[i].start < all[j].end && all[j].start < all[i].end) {
            const a = all[i].persisted ? "un créneau existant" : `le créneau ${filled.indexOf(all[i]) + 1}`;
            const b = all[j].persisted ? "un créneau existant" : `le créneau ${filled.indexOf(all[j]) + 1}`;
            errors.push(`${a} chevauche ${b}`);
          }
        }
      }

      if (errors.length > 0) errs[day] = [...new Set(errors)];
    }
    setDayErrors(errs);
  }, [slots, selectedDays, existingAvailabilities]);

  if (!open) return null;

  const toggleDay = (day) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        const next = prev.filter((d) => d !== day);
        setSlots((s) => { const c = { ...s }; delete c[day]; return c; });
        return next;
      }
      setSlots((s) => ({ ...s, [day]: [{ start: "", end: "" }] }));
      return [...prev, day];
    });
  };

  const addSlot = (day) => setSlots((s) => ({ ...s, [day]: [...(s[day] || []), { start: "", end: "" }] }));
  const removeSlot = (day, idx) => {
    setSlots((s) => {
      const remaining = s[day].filter((_, i) => i !== idx);
      if (remaining.length === 0) {
        const c = { ...s }; delete c[day]; return c;
      }
      return { ...s, [day]: remaining };
    });
    setSelectedDays((prev) => {
      const remaining = (slots[day] || []).filter((_, i) => i !== idx);
      return remaining.length === 0 ? prev.filter((d) => d !== day) : prev;
    });
  };
  const updateSlot = (day, idx, field, value) => setSlots((s) => ({ ...s, [day]: s[day].map((sl, i) => i === idx ? { ...sl, [field]: value } : sl) }));

  const handleCopy = (source) => { setCopySource(source); setCopyTargets([]); };
  const toggleCopyTarget = (day) => setCopyTargets((p) => p.includes(day) ? p.filter((d) => d !== day) : [...p, day]);
  const confirmCopy = () => {
    if (!copySource || copyTargets.length === 0) return;
    const sr = slots[copySource] || [];
    setSlots((s) => {
      const u = { ...s };
      for (const day of copyTargets) u[day] = sr.map((sl) => ({ ...sl }));
      return u;
    });
    setCopySource(null);
    setCopyTargets([]);
  };

  const openExcForm = (exc = null) => {
    if (exc) {
      setEditingExc(exc);
      setExcDate(exc.date);
      setExcType(exc.type);
      setExcSlots(
        exc.type === "horaires_personnalises" && exc.creneaux?.length
          ? exc.creneaux.map((c) => ({ start: c.start, end: c.end }))
          : [{ start: "", end: "" }]
      );
    } else {
      setEditingExc(null);
      setExcDate("");
      setExcType("indisponible");
      setExcSlots([{ start: "", end: "" }]);
    }
    setExcFormOpen(true);
  };
  const closeExcForm = () => { setExcFormOpen(false); setEditingExc(null); };

  const addExcSlot = () => setExcSlots((p) => [...p, { start: "", end: "" }]);
  const removeExcSlot = (i) => setExcSlots((p) => p.filter((_, j) => j !== i));
  const updateExcSlot = (i, field, val) => setExcSlots((p) => p.map((s, j) => j === i ? { ...s, [field]: val } : s));

  const saveException = async () => {
    if (!excDate) return;
    setExcError("");
    const payload = {
      date: excDate,
      type: excType,
      creneaux: excType === "horaires_personnalises"
        ? excSlots.filter((s) => s.start && s.end).map((s) => ({ start: s.start, end: s.end }))
        : [],
    };
    try {
      if (editingExc) {
        await onUpdateException(editingExc.id, payload);
      } else {
        await onAddException(payload);
      }
      closeExcForm();
    } catch (err) {
      setExcError(err?.message || "Erreur lors de l'enregistrement");
    }
  };

  const hasValidSlots = selectedDays.some((day) => {
    const daySlots = slots[day] || [];
    return daySlots.some((s) => s.start && s.end && s.start < s.end);
  });
  const hasErrors = Object.values(dayErrors).some((e) => e.length > 0);
  const canSubmit = hasValidSlots && !hasErrors;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const allSlots = [];
    for (const day of selectedDays) {
      const daySlots = slots[day] || [];
      for (const slot of daySlots) {
        if (slot.start && slot.end) {
          allSlots.push({ id: Date.now() + Math.random(), day, startTime: slot.start, endTime: slot.end, status: "available" });
        }
      }
    }
    if (allSlots.length === 0) return;

    // Double vérification avec les données persistées avant envoi
    for (const slot of allSlots) {
      const persisted = existingAvailabilities.filter((a) => a.day === slot.day);
      for (const p of persisted) {
        if (slot.startTime < p.endTime && p.startTime < slot.endTime) {
          return; // un chevauchement a été détecté, le bouton est déjà désactivé par dayErrors
        }
      }
    }

    onSave({ slots: allSlots, repeat: repeatMode, repeatEndDate: repeatEndDate || null });
    onClose();
    setSelectedDays([]); setSlots({}); setDayErrors({}); setRepeatMode("none"); setRepeatEndDate("");
  };

  const btnBase = (active) => active
    ? "bg-blue-600 text-white border-blue-600"
    : darkMode ? "bg-gray-800 text-gray-300 border-gray-700" : "bg-white text-gray-700 border-gray-200";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className={`w-full sm:max-w-lg max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold">Gérer les disponibilités</h2>
            <p className={`text-xs sm:text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Définissez des créneaux pour chaque jour</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-200/10 flex-shrink-0"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* JOURS */}
          <div>
            <label className="block text-sm font-medium mb-3">Jours disponibles</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {weekDays.map((day) => {
                const active = selectedDays.includes(day);
                return (
                  <button type="button" key={day} onClick={() => toggleDay(day)}
                    className={`flex items-center justify-center gap-1.5 min-h-[48px] px-2 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium transition break-words text-center ${btnBase(active)}`}>
                    {active && <Check className="w-4 h-4 flex-shrink-0" />}
                    <span className="leading-tight">{day}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CRÉNEAUX */}
          {selectedDays.length > 0 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium">Créneaux horaires</label>
              {selectedDays.map((day) => {
                const daySlots = slots[day] || [];
                const persistedForDay = existingAvailabilities.filter((a) => a.day === day && a.actif !== false);
                return (
                  <div key={day} className={`rounded-xl border p-4 space-y-3 ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
                    <p className="text-sm font-semibold">{day}</p>

                    {persistedForDay.length > 0 && (
                      <div className="space-y-2">
                        <p className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Créneaux enregistrés</p>
                        {persistedForDay.map((p) => (
                          <div key={p.id} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs ${darkMode ? "border-gray-600 bg-gray-700/50" : "border-gray-200 bg-white"}`}>
                            <span className="font-medium">{p.startTime} - {p.endTime}</span>
                            <button type="button" onClick={() => onDeleteAvailability?.(p.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Nouveaux créneaux</p>
                      {daySlots.map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <TimeSelect value={slot.start} onChange={(v) => updateSlot(day, idx, "start", v)} darkMode={darkMode} placeholder="Début" />
                          <span className="text-gray-400">-</span>
                          <TimeSelect value={slot.end} onChange={(v) => updateSlot(day, idx, "end", v)} darkMode={darkMode} placeholder="Fin" />
                          <button type="button" onClick={() => removeSlot(day, idx)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>

                    {dayErrors[day]?.length > 0 && (
                      <div className={`space-y-1 p-2.5 rounded-xl border ${darkMode ? "bg-red-900/20 border-red-500/20" : "bg-red-50 border-red-200"}`}>
                        {dayErrors[day].map((err, i) => <p key={i} className={`text-xs font-medium ${darkMode ? "text-red-400" : "text-red-600"}`}>{err}</p>)}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => addSlot(day)} className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 transition font-medium"><Plus className="w-3.5 h-3.5" /> Ajouter un créneau</button>
                      {selectedDays.length > 1 && daySlots.some((s) => s.start && s.end) && (
                        <button type="button" onClick={() => handleCopy(day)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition font-medium"><Copy className="w-3.5 h-3.5" /> Copier vers...</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {copySource && (
            <div className={`rounded-xl border p-4 space-y-3 ${darkMode ? "border-blue-700 bg-blue-900/20" : "border-blue-200 bg-blue-50"}`}>
              <p className="text-sm font-semibold">Copier les créneaux de <span className="text-blue-500">{copySource}</span> vers :</p>
              <div className="flex flex-wrap gap-2">
                {selectedDays.filter((d) => d !== copySource).map((day) => {
                  const active = copyTargets.includes(day);
                  return (
                    <button type="button" key={day} onClick={() => toggleCopyTarget(day)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${btnBase(active)}`}>
                      {active && <Check className="w-3 h-3" />}{day}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400">Les créneaux copiés écraseront ceux déjà définis pour ces jours.</p>
              <div className="flex gap-2">
                <button type="button" onClick={confirmCopy} disabled={copyTargets.length === 0} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">Copier</button>
                <button type="button" onClick={() => { setCopySource(null); setCopyTargets([]); }} className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${darkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}>Annuler</button>
              </div>
            </div>
          )}

          {/* RÉPÉTITION */}
          <div className={`rounded-xl border p-4 space-y-3 ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
            <p className="text-sm font-semibold">Répétition</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "none", label: "Aucune (unique)" },
                { value: "daily", label: "Quotidien" },
                { value: "weekly", label: "Chaque semaine" },
                { value: "biweekly", label: "Toutes les 2 semaines" },
                { value: "monthly", label: "Chaque mois" },
              ].map(({ value, label }) => (
                <button type="button" key={value} onClick={() => setRepeatMode(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${btnBase(repeatMode === value)}`}>
                  {label}
                </button>
              ))}
            </div>
            {repeatMode !== "none" && (
              <div>
                <label className="block text-xs font-medium mb-1">Date de fin</label>
                <input type="date" value={repeatEndDate} onChange={(e) => setRepeatEndDate(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`} />
                {!repeatEndDate && <p className="text-xs text-gray-400 mt-1">Laisser vide pour une répétition sans date de fin</p>}
              </div>
            )}
          </div>

          {/* EXCEPTIONS */}
          <div className={`rounded-xl border p-4 space-y-3 ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Exceptions</p>
              <button type="button" onClick={() => openExcForm(null)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition">
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>
            {exceptions.length === 0 ? (
              <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Aucune exception définie</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {exceptions.map((exc) => (
                  <div key={exc.id} className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border text-xs ${darkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
                      <span className="font-medium whitespace-nowrap">{exc.date}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${exc.type === "indisponible" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"}`}>
                        {exc.type === "indisponible" ? "Indisponible" : "Horaires personnalisés"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button type="button" onClick={() => openExcForm(exc)} className="p-1.5 rounded-lg hover:bg-gray-200/20 transition"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => onDeleteException(exc.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {Object.values(dayErrors).some((e) => e.length > 0) && (
            <div className={`p-3 rounded-xl text-xs sm:text-sm font-medium border ${darkMode ? "bg-red-900/20 text-red-400 border-red-500/20" : "bg-red-50 text-red-600 border-red-200"}`}>
              {(() => {
                const msgs = Object.entries(dayErrors).filter(([, e]) => e.length > 0).map(([day]) => day);
                return `Certains créneaux se chevauchent sur ${msgs.join(", ")}. Corrigez les horaires avant d'enregistrer.`;
              })()}
            </div>
          )}
          <button type="submit" disabled={!canSubmit}
            className={`w-full py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium transition ${
              canSubmit
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/15"
                : darkMode
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-blue-200 text-blue-400 cursor-not-allowed"
            }`}>
            Enregistrer
          </button>
        </form>

        {/* MODALE AJOUT / ÉDITION EXCEPTION */}
        {excFormOpen && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={closeExcForm}>
            <div className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold">{editingExc ? "Modifier l'exception" : "Ajouter une exception"}</h3>
                <button type="button" onClick={closeExcForm} className="p-1.5 rounded-xl hover:bg-gray-200/10"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Date</label>
                  <input type="date" value={excDate} onChange={(e) => setExcDate(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2">Type</label>
                  <div className="flex gap-2">
                    {["indisponible", "horaires_personnalises"].map((t) => (
                      <button type="button" key={t} onClick={() => { setExcType(t); if (t === "indisponible") setExcSlots([{ start: "", end: "" }]); }}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition ${btnBase(excType === t)}`}>
                        {t === "indisponible" ? "Indisponible toute la journée" : "Horaires personnalisés"}
                      </button>
                    ))}
                  </div>
                </div>
                {excType === "horaires_personnalises" && (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium">Créneaux</label>
                    {excSlots.map((slot, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <TimeSelect value={slot.start} onChange={(v) => updateExcSlot(i, "start", v)} darkMode={darkMode} placeholder="Début" />
                        <span className="text-gray-400">-</span>
                        <TimeSelect value={slot.end} onChange={(v) => updateExcSlot(i, "end", v)} darkMode={darkMode} placeholder="Fin" />
                        {excSlots.length > 1 && (
                          <button type="button" onClick={() => removeExcSlot(i)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addExcSlot} className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 transition font-medium"><Plus className="w-3.5 h-3.5" /> Ajouter un créneau</button>
                  </div>
                )}
                {excError && (
                  <div className={`p-3 rounded-xl text-xs font-medium border ${darkMode ? "bg-red-900/20 text-red-400 border-red-500/20" : "bg-red-50 text-red-600 border-red-200"}`}>
                    {excError}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={saveException} disabled={!excDate} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
                    {editingExc ? "Modifier" : "Ajouter"}
                  </button>
                  <button type="button" onClick={closeExcForm}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition ${darkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
