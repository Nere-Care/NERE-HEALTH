import { useState } from "react";
import { X, Calendar, Clock, Video, MapPin, CheckCircle, MessageCircle } from "lucide-react";

export default function ScheduleOpinionMeeting({ open, onClose, request, onSchedule, darkMode }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [mode, setMode] = useState("video");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState(30);

  if (!open) return null;

  const modeMessage = mode === "message";

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!modeMessage && (!date || !time)) {
    alert("Veuillez sélectionner une date et une heure");
    return;
  }

  const meetingDateTime = modeMessage ? null : new Date(`${date}T${time}`).toISOString();

  try {
    // ✅ Appel à onSchedule (qui va déclencher la création de la conversation)
    await onSchedule(request, {
      meetingDate: meetingDateTime,
      mode,
      duration: modeMessage ? null : duration,
      notes,
    });

    // ✅ Feedback visuel
    // La navigation vers /messages se fera automatiquement via le parent
  } catch (err) {
    console.error("Erreur:", err);
    alert("Erreur lors de la planification: " + err.message);
  }
};

  const modes = [
    { value: "video",      label: "Video",      icon: Video,         desc: "Cree un RDV video" },
    { value: "presentiel", label: "Presentiel", icon: MapPin,        desc: "Cree un RDV en cabinet" },
    { value: "message",    label: "Par message",icon: MessageCircle, desc: "Ouvre une conversation" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className={`w-full sm:max-w-lg lg:max-w-xl max-h-[95vh] overflow-hidden rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col
        ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>

        {/* Header */}
        <div className={`sticky top-0 z-20 flex items-center justify-between p-4 sm:p-5 border-b flex-shrink-0
          ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-base sm:text-lg">Accepter la demande</h2>
              <p className={`text-[10px] sm:text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Dr. {request.requesterName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5">

            {/* MODE */}
            <div>
              <label className="text-xs sm:text-sm font-semibold mb-3 block">
                Mode de collaboration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {modes.map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition min-h-[80px]
                      ${mode === value
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"
                      }`}
                  >
                    <Icon size={20} />
                    <span className="text-xs font-semibold text-center leading-tight">{label}</span>
                  </button>
                ))}
              </div>
              {/* Description du mode */}
              <p className={`mt-2 text-xs text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {modes.find(m => m.value === mode)?.desc}
              </p>
            </div>

            {/* DATE / HEURE — masquées si mode message */}
            {!modeMessage && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs sm:text-sm font-semibold mb-2 flex items-center gap-1">
                      <Calendar size={14} /> Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setDate(e.target.value)}
                      required={!modeMessage}
                      className={`w-full px-3 py-2.5 rounded-xl border outline-none text-sm
                        ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-semibold mb-2 flex items-center gap-1">
                      <Clock size={14} /> Heure
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required={!modeMessage}
                      className={`w-full px-3 py-2.5 rounded-xl border outline-none text-sm
                        ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold mb-2 block">Duree estimee</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 45, 60].map((d) => (
                      <button key={d} type="button" onClick={() => setDuration(d)}
                        className={`py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition
                          ${duration === d ? "bg-blue-500 text-white" : darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}>
                        {d} min
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Mode message : message informatif */}
            {modeMessage && (
              <div className={`flex items-start gap-3 p-4 rounded-xl ${darkMode ? "bg-blue-900/20 border border-blue-800" : "bg-blue-50 border border-blue-200"}`}>
                <MessageCircle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-600">Collaboration par messagerie</p>
                  <p className={`text-xs mt-1 ${darkMode ? "text-blue-300" : "text-blue-700"}`}>
                    Une conversation privee sera creee entre vous et Dr. {request.requesterName}. Vous pourrez echanger directement dans la messagerie.
                  </p>
                </div>
              </div>
            )}

            {/* NOTES */}
            <div>
              <label className="text-xs sm:text-sm font-semibold mb-2 block">
                Message initial
                <span className="text-[10px] sm:text-xs font-normal opacity-60 ml-2">(optionnel)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={modeMessage
                  ? "Ex: Bonjour confrere, j'accepte votre demande. Voici mes premieres reflexions..."
                  : "Ex: Preparation avant la consultation, documents a apporter..."}
                rows={3}
                className={`w-full px-3 py-2.5 rounded-xl border outline-none resize-none text-sm
                  ${darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-200 placeholder-gray-400"}`}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 p-4 border-t flex flex-col sm:flex-row gap-2 flex-shrink-0
          ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}>
          <button type="button" onClick={onClose}
            className={`flex-1 py-3 rounded-xl font-semibold transition text-sm
              ${darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            Annuler
          </button>
          <button type="submit" onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl font-semibold bg-green-600 text-white hover:bg-green-700 transition text-sm flex items-center justify-center gap-2">
            <CheckCircle size={16} />
            {modeMessage ? "Ouvrir la conversation" : "Confirmer le RDV"}
          </button>
        </div>
      </div>
    </div>
  );
}