import { useState, useEffect } from "react";
import { X, Clock, CalendarDays, Loader, AlertCircle, ChevronDown } from "lucide-react";
import { get, post as apiPost } from "../../../services/apiClient";
import { getUserTimezone, slotToUTCISO } from "../../../utils/timezone";
import { getStoredUser } from "../../../services/auth";

const MAX_VISIBLE_SLOTS = 5;

export default function RescheduleForm({
  open,
  onClose,
  selectedAppointment,
  darkMode,
  onSave,
}) {
  const [creneaux, setCreneaux] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [expandedDates, setExpandedDates] = useState({});

  useEffect(() => {
    if (!open || !selectedAppointment) return;
    setCreneaux([]);
    setSelectedSlot(null);
    setError(null);
    setLoading(true);
    setExpandedDates({});

    const tz = getUserTimezone();
    const now = new Date();
    const rdvDate = new Date(selectedAppointment.dateHeureDebut || selectedAppointment.dateDebut);
    const rdvOnlyDate = new Date(rdvDate.getFullYear(), rdvDate.getMonth(), rdvDate.getDate());

    const minDate = new Date(rdvOnlyDate);
    minDate.setDate(minDate.getDate() - 5);
    const maxDate = new Date(rdvOnlyDate);
    maxDate.setDate(maxDate.getDate() + 7);

    const minAllowed = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const startFetch = new Date(Math.max(minDate.getTime(), now.getTime()));
    const endFetch = maxDate;

    const y = startFetch.getFullYear();
    const m = String(startFetch.getMonth() + 1).padStart(2, "0");
    const d = String(startFetch.getDate()).padStart(2, "0");
    const clientNow = `${y}-${m}-${d}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const medecinId = selectedAppointment.medecinId || selectedAppointment.medecin_id;
    const fetches = [];
    const totalDays = Math.ceil((endFetch.getTime() - startFetch.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    for (let i = 0; i < totalDays; i++) {
      const dt = new Date(startFetch.getFullYear(), startFetch.getMonth(), startFetch.getDate() + i);
      const ds = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      fetches.push(
        get(`/api/disponibilites/creneaux/${medecinId}`, { date: ds, now: clientNow })
          .then((slots) => ({ date: ds, slots: Array.isArray(slots) ? slots : [] }))
          .catch(() => ({ date: ds, slots: [] }))
      );
    }
    Promise.all(fetches)
      .then((results) => {
        setCreneaux(
          results
            .filter((r) => r.slots.length > 0)
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
  }, [open, selectedAppointment]);

  if (!open) return null;

  const toggleExpanded = (date) => {
    setExpandedDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const handleConfirm = async () => {
    if (!selectedSlot || !selectedAppointment) return;
    setSaving(true);
    setError(null);
    try {
      const rdvId = selectedAppointment.id;
      const doctorTz = getStoredUser()?.timezone || "Africa/Douala";
      const debutISO = slotToUTCISO(selectedSlot.date, selectedSlot.start, doctorTz);
      const finISO = slotToUTCISO(selectedSlot.date, selectedSlot.end, doctorTz);
      await apiPost(`/api/rendez_vous/${rdvId}/propose-reschedule`, {
        date_heure_debut: debutISO,
        date_heure_fin: finISO,
      });
      if (onSave) onSave(rdvId, selectedSlot.date, selectedSlot.start);
      onClose();
    } catch (err) {
      setError(err?.message || "Erreur lors de l'envoi de la demande");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div
        className={`w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl p-6 shadow-xl ${
          darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        }`}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold text-blue-500">
            Reprogrammer le rendez-vous
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mb-4 text-sm opacity-70">
          Patient : {selectedAppointment?.patient}
        </p>
        <p className="mb-4 text-xs opacity-50">
          Actuellement : {selectedAppointment?.dateHeureDebut ? new Date(selectedAppointment.dateHeureDebut).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : ""} à {selectedAppointment?.dateHeureDebut ? new Date(selectedAppointment.dateHeureDebut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""}
        </p>

        <div className={`p-3 rounded-xl text-xs mb-4 ${darkMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-50 text-amber-700"}`}>
          Le patient devra valider le nouveau créneau proposé.
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader size={24} className="animate-spin text-blue-500" />
            <span className="ml-2 text-sm opacity-70">Chargement des créneaux...</span>
          </div>
        ) : creneaux.length === 0 ? (
          <div className="text-center py-8 opacity-50 text-sm">
            Aucun créneau disponible dans les 7 prochains jours.
          </div>
        ) : (
          <div className="space-y-4 mb-4">
            {creneaux.map((group) => {
              const isExpanded = expandedDates[group.date];
              const visibleSlots = isExpanded ? group.slots : group.slots.slice(0, MAX_VISIBLE_SLOTS);
              const hasMore = group.slots.length > MAX_VISIBLE_SLOTS;
              return (
                <div key={group.date}>
                  <p className={`text-xs font-semibold mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
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
                              : darkMode
                              ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                              : "border-gray-200 text-gray-700 hover:bg-gray-50"
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
                          darkMode
                            ? "border-gray-600 text-gray-400 hover:bg-gray-700"
                            : "border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <ChevronDown size={12} />
                        +{group.slots.length - MAX_VISIBLE_SLOTS} de plus
                      </button>
                    )}
                    {hasMore && isExpanded && (
                      <button
                        onClick={() => toggleExpanded(group.date)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed transition-all flex items-center gap-1 ${
                          darkMode
                            ? "border-gray-600 text-gray-400 hover:bg-gray-700"
                            : "border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        Réduire
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedSlot && (
          <div className={`p-3 rounded-xl text-xs mb-4 ${darkMode ? "bg-blue-900/40 text-blue-400" : "bg-blue-50 text-blue-700"}`}>
            Créneau proposé : {formatDate(selectedSlot.date)} à {selectedSlot.start}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl text-xs mb-4 flex items-center gap-2 bg-red-50 text-red-600">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className={`flex-1 py-3 rounded-xl text-sm border font-medium ${darkMode ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600"}`}
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedSlot || saving}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              selectedSlot && !saving ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {saving && <Loader size={14} className="animate-spin" />}
            {saving ? "Envoi en cours..." : "Proposer au patient"}
          </button>
        </div>
      </div>
    </div>
  );
}
