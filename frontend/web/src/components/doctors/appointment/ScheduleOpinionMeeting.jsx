// components/doctors/appointment/ScheduleOpinionMeeting.jsx

import { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle,
} from "lucide-react";

export default function ScheduleOpinionMeeting({
  open,
  onClose,
  request,
  onSchedule,
  darkMode,
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [mode, setMode] = useState("video");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState(30);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!date || !time) return;

    const meetingDateTime = new Date(`${date}T${time}`);

    onSchedule(request, {
      meetingDate: meetingDateTime.toISOString(),
      mode,
      duration,
      notes,
    });
  };

  return (
    <div
      className="
        fixed inset-0 z-50
        bg-black/50
        flex items-end sm:items-center
        justify-center
        p-0 sm:p-4
      "
    >
      <div
        className={`
          w-full
          sm:max-w-lg
          lg:max-w-xl
          max-h-[95vh]
          overflow-hidden
          rounded-t-3xl
          sm:rounded-2xl
          shadow-2xl
          flex
          flex-col
          ${darkMode
            ? "bg-gray-900 text-white"
            : "bg-white text-gray-800"}
        `}
      >
        {/* Header */}
        <div
          className={`
            sticky top-0 z-20
            flex items-center justify-between
            p-4 sm:p-5
            border-b
            flex-shrink-0
            ${darkMode
              ? "bg-gray-900 border-gray-700"
              : "bg-white border-gray-100"}
          `}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
            <div
              className="
                w-8 h-8
                sm:w-10 sm:h-10
                rounded-full
                bg-green-100
                flex items-center justify-center
                flex-shrink-0
              "
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-base sm:text-lg break-words">
                Accepter la demande
              </h2>

              <p
                className={`
                  text-[10px] sm:text-xs
                  break-words
                  ${darkMode
                    ? "text-gray-400"
                    : "text-gray-500"}
                `}
              >
                Dr. {request.requesterName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`
              p-1.5 sm:p-2
              rounded-lg
              flex-shrink-0
              transition
              ${darkMode
                ? "hover:bg-gray-800"
                : "hover:bg-gray-100"}
            `}
          >
            <X size={18} className="sm:hidden" />
            <X size={20} className="hidden sm:inline" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          <form
            onSubmit={handleSubmit}
            className="p-4 sm:p-5 space-y-5"
          >
            {/* Mode */}
            <div>
              <label className="text-xs sm:text-sm font-semibold mb-2 block">
                Mode de consultation
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("video")}
                  className={`
                    min-h-[52px]
                    p-2.5 sm:p-3
                    rounded-xl
                    border-2
                    flex items-center justify-center
                    gap-1.5 sm:gap-2
                    transition
                    ${
                      mode === "video"
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : darkMode
                        ? "border-gray-700 text-gray-400"
                        : "border-gray-200 text-gray-500"
                    }
                  `}
                >
                  <Video size={16} className="sm:hidden" />
                  <Video size={18} className="hidden sm:inline" />

                  <span className="text-xs sm:text-sm font-semibold">
                    Vidéo
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("presentiel")}
                  className={`
                    min-h-[52px]
                    p-2.5 sm:p-3
                    rounded-xl
                    border-2
                    flex items-center justify-center
                    gap-1.5 sm:gap-2
                    transition
                    ${
                      mode === "presentiel"
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : darkMode
                        ? "border-gray-700 text-gray-400"
                        : "border-gray-200 text-gray-500"
                    }
                  `}
                >
                  <MapPin size={16} className="sm:hidden" />
                  <MapPin size={18} className="hidden sm:inline" />

                  <span className="text-xs sm:text-sm font-semibold">
                    Présentiel
                  </span>
                </button>
              </div>
            </div>

            {/* Date / Heure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className="text-xs sm:text-sm font-semibold mb-2 flex items-center gap-1">
                  <Calendar size={12} className="sm:hidden" />
                  <Calendar size={14} className="hidden sm:inline" />
                  Date
                </label>

                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className={`
                    w-full
                    px-3 py-2.5
                    rounded-xl
                    border
                    outline-none
                    text-sm
                    ${darkMode
                      ? "bg-gray-800 border-gray-700 text-white"
                      : "bg-white border-gray-200"}
                  `}
                />
              </div>

              <div className="min-w-0">
                <label className="text-xs sm:text-sm font-semibold mb-2 flex items-center gap-1">
                  <Clock size={12} className="sm:hidden" />
                  <Clock size={14} className="hidden sm:inline" />
                  Heure
                </label>

                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className={`
                    w-full
                    px-3 py-2.5
                    rounded-xl
                    border
                    outline-none
                    text-sm
                    ${darkMode
                      ? "bg-gray-800 border-gray-700 text-white"
                      : "bg-white border-gray-200"}
                  `}
                />
              </div>
            </div>

            {/* Durée */}
            <div>
              <label className="text-xs sm:text-sm font-semibold mb-2 block">
                Durée estimée
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`
                      py-2.5
                      rounded-lg
                      text-xs sm:text-sm
                      font-semibold
                      transition
                      ${
                        duration === d
                          ? "bg-blue-500 text-white"
                          : darkMode
                          ? "bg-gray-800 text-gray-400"
                          : "bg-gray-100 text-gray-600"
                      }
                    `}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs sm:text-sm font-semibold mb-2 block">
                Notes internes{" "}
                <span className="text-[10px] sm:text-xs font-normal opacity-60">
                  (optionnel)
                </span>
              </label>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Préparation avant la consultation..."
                rows={4}
                className={`
                  w-full
                  px-3 py-2.5
                  rounded-xl
                  border
                  outline-none
                  resize-none
                  text-sm
                  ${darkMode
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-white border-gray-200"}
                `}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div
          className={`
            sticky bottom-0
            p-4
            border-t
            flex flex-col sm:flex-row
            gap-2
            flex-shrink-0
            ${darkMode
              ? "bg-gray-900 border-gray-700"
              : "bg-white border-gray-100"}
          `}
        >
          <button
            type="button"
            onClick={onClose}
            className={`
              flex-1
              py-3
              rounded-xl
              font-semibold
              transition
              text-sm
              ${darkMode
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}
            `}
          >
            Annuler
          </button>

          <button
            type="submit"
            onClick={handleSubmit}
            className="
              flex-1
              py-3
              rounded-xl
              font-semibold
              bg-blue-600
              text-white
              hover:bg-blue-700
              transition
              text-sm
            "
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}