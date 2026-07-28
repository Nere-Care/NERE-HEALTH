import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle,
  Loader,
  ChevronDown,
} from "lucide-react";
import { get, post as apiPost } from "../../../services/apiClient";
import { getUserTimezone, slotToUTCISO } from "../../../utils/timezone";
import { getStoredUser } from "../../../services/auth";

const MAX_VISIBLE_SLOTS = 5;

export default function ScheduleOpinionMeeting({
  open,
  onClose,
  request,
  onSchedule,
  darkMode,
}) {
  const [creneaux, setCreneaux] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [mode, setMode] = useState("video");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [expandedDates, setExpandedDates] = useState({});

  useEffect(() => {
    if (!open) return;
    setCreneaux([]);
    setSelectedSlot(null);
    setError(null);
    setLoading(true);
    setExpandedDates({});

    const tz = getUserTimezone();
    const now = new Date();
    const startFetch = new Date(now);
    const endFetch = new Date(now);
    endFetch.setDate(endFetch.getDate() + 14);

    const y = startFetch.getFullYear();
    const m = String(startFetch.getMonth() + 1).padStart(2, "0");
    const d = String(startFetch.getDate()).padStart(2, "0");
    const clientNow = `${y}-${m}-${d}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const medecinCibleId = getStoredUser()?.id;
    const medecinDemandeurId = request?.medecinDemandeurId;
    const minAllowed = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const totalDays = Math.ceil((endFetch.getTime() - startFetch.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const fetchSlots = (medecinId) => {
      const dayFetches = [];
      for (let i = 0; i < totalDays; i++) {
        const dt = new Date(startFetch.getFullYear(), startFetch.getMonth(), startFetch.getDate() + i);
        const ds = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
        dayFetches.push(
          get(`/api/disponibilites/creneaux/${medecinId}`, { date: ds, now: clientNow })
            .then((slots) => ({ date: ds, slots: Array.isArray(slots) ? slots : [] }))
            .catch(() => ({ date: ds, slots: [] }))
        );
      }
      return Promise.all(dayFetches);
    };

    const timeToMinutes = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const minutesToTime = (mins) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    Promise.all([
      fetchSlots(medecinCibleId),
      medecinDemandeurId ? fetchSlots(medecinDemandeurId) : Promise.resolve([]),
    ])
      .then(([cibleResults, demandeurResults]) => {
        const demandeurByDate = {};
        for (const group of demandeurResults) {
          demandeurByDate[group.date] = group.slots;
        }

        setCreneaux(
          cibleResults
            .filter((r) => r.slots.length > 0)
            .map((group) => {
              const dSlots = demandeurByDate[group.date] || [];
              if (dSlots.length === 0) return { ...group, slots: [] };

              const common = [];
              for (const cs of group.slots) {
                const cStart = timeToMinutes(cs.start);
                const cEnd = timeToMinutes(cs.end);
                for (const ds of dSlots) {
                  const dStart = timeToMinutes(ds.start);
                  const dEnd = timeToMinutes(ds.end);
                  const overlapStart = Math.max(cStart, dStart);
                  const overlapEnd = Math.min(cEnd, dEnd);
                  if (overlapEnd - overlapStart >= 15) {
                    common.push({ start: minutesToTime(overlapStart), end: minutesToTime(overlapEnd) });
                  }
                }
              }
              return { ...group, slots: common };
            })
            .map((group) => ({
              ...group,
              slots: group.slots.filter((slot) => {
                const slotDate = new Date(`${group.date}T${slot.start}`);
                return slotDate >= minAllowed;
              }),
            }))
            .filter((group) => group.slots.length > 0)
        );
      })
      .catch(() => setCreneaux([]))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const toggleExpanded = (date) => {
    setExpandedDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !request) return;
    setSaving(true);
    setError(null);

    try {
      const user = getStoredUser();
      const doctorTz = user?.timezone || "Africa/Douala";
      const debutISO = slotToUTCISO(selectedSlot.date, selectedSlot.start, doctorTz);

      const [startH, startM] = selectedSlot.start.split(":").map(Number);
      const endMinutes = startH * 60 + startM + duration;
      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      const finTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
      const finISO = slotToUTCISO(selectedSlot.date, finTime, doctorTz);

      const rdvPayload = {
        patient_id: request.patientId,
        medecin_id: user.id,
        date_heure_debut: debutISO,
        date_heure_fin: finISO,
        type: mode,
        motif_consultation: `Demande d'avis - ${request.motif || ""}`,
        notes_pre_consultation: notes || null,
      };

      const rdv = await apiPost("/api/rendez_vous", rdvPayload);

      onSchedule(request, {
        meetingDate: debutISO,
        date_heure_debut: debutISO,
        date_heure_fin: finISO,
        mode,
        duration,
        notes,
        rdvId: rdv?.id,
      });
      onClose();
    } catch (err) {
      setError(err?.message || "Erreur lors de la creation du rendez-vous");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className={`w-full sm:max-w-lg lg:max-w-xl max-h-[95vh] overflow-hidden rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col ${
          darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"
        }`}
      >
        {/* Header */}
        <div className={`sticky top-0 z-20 flex items-center justify-between p-4 sm:p-5 border-b flex-shrink-0 ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-base sm:text-lg break-words">Planifier un RDV</h2>
              <p className={`text-[10px] sm:text-xs break-words ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Dr. {request.requesterName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-5">

          {/* Patient info */}
          {request.patientNom && (
            <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
              <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Patient</p>
              <p className="text-sm font-medium">{request.patientPrenom} {request.patientNom}</p>
            </div>
          )}

          {/* Mode */}
          <div>
            <label className="text-xs sm:text-sm font-semibold mb-2 block">Mode de consultation</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("video")}
                className={`min-h-[52px] p-2.5 sm:p-3 rounded-xl border-2 flex items-center justify-center gap-1.5 sm:gap-2 transition ${
                  mode === "video"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"
                }`}
              >
                <Video size={16} />
                <span className="text-xs sm:text-sm font-semibold">Video</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("presentiel")}
                className={`min-h-[52px] p-2.5 sm:p-3 rounded-xl border-2 flex items-center justify-center gap-1.5 sm:gap-2 transition ${
                  mode === "presentiel"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"
                }`}
              >
                <MapPin size={16} />
                <span className="text-xs sm:text-sm font-semibold">Presentiel</span>
              </button>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs sm:text-sm font-semibold mb-2 block">Duree estimee</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[15, 30, 45, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                    duration === d
                      ? "bg-blue-500 text-white"
                      : darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Planning slots */}
          <div>
            <label className="text-xs sm:text-sm font-semibold mb-2 block flex items-center gap-1">
              <Clock size={14} />
              Creneaux disponibles
            </label>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader size={20} className="animate-spin text-blue-500" />
                <span className="ml-2 text-sm opacity-70">Recherche des creneaux communs...</span>
              </div>
            ) : creneaux.length === 0 ? (
              <div className={`text-center py-8 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Aucun creneau commun disponible dans les 14 prochains jours.
              </div>
            ) : (
              <div className="space-y-3">
                {creneaux.map((group) => {
                  const isExpanded = expandedDates[group.date];
                  const visibleSlots = isExpanded ? group.slots : group.slots.slice(0, MAX_VISIBLE_SLOTS);
                  const hasMore = group.slots.length > MAX_VISIBLE_SLOTS;
                  return (
                    <div key={group.date}>
                      <p className={`text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {formatDate(group.date)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {visibleSlots.map((slot) => {
                          const heure = slot.start.slice(0, 5);
                          const isSelected = selectedSlot?.date === group.date && selectedSlot?.start === slot.start;
                          return (
                            <button
                              key={`${group.date}-${heure}`}
                              onClick={() => setSelectedSlot({ date: group.date, start: slot.start, end: slot.end })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                isSelected
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {heure}
                            </button>
                          );
                        })}
                        {hasMore && !isExpanded && (
                          <button
                            onClick={() => toggleExpanded(group.date)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed transition-all flex items-center gap-1 ${
                              darkMode ? "border-gray-600 text-gray-400 hover:bg-gray-700" : "border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            <ChevronDown size={12} />
                            +{group.slots.length - MAX_VISIBLE_SLOTS} de plus
                          </button>
                        )}
                        {hasMore && isExpanded && (
                          <button
                            onClick={() => toggleExpanded(group.date)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed transition-all ${
                              darkMode ? "border-gray-600 text-gray-400 hover:bg-gray-700" : "border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            Reduire
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedSlot && (
              <div className={`p-2.5 rounded-xl text-xs mt-3 ${darkMode ? "bg-blue-900/40 text-blue-400" : "bg-blue-50 text-blue-700"}`}>
                Creeneau selectionne : {formatDate(selectedSlot.date)} a {selectedSlot.start}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs sm:text-sm font-semibold mb-2 block">
              Notes internes <span className="text-[10px] sm:text-xs font-normal opacity-60">(optionnel)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preparation avant la consultation..."
              rows={3}
              className={`w-full px-3 py-2.5 rounded-xl border outline-none resize-none text-sm ${
                darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"
              }`}
            />
          </div>

          {error && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${darkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"}`}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 p-4 border-t flex flex-col sm:flex-row gap-2 flex-shrink-0 ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}>
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 py-3 rounded-xl font-semibold transition text-sm ${darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedSlot || saving}
            className={`flex-1 py-3 rounded-xl font-semibold transition text-sm flex items-center justify-center gap-2 ${
              selectedSlot && !saving
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {saving && <Loader size={14} className="animate-spin" />}
            {saving ? "Creation..." : "Creer le RDV"}
          </button>
        </div>
      </div>
    </div>
  );
}
