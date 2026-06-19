import { useState } from "react";
import { X, Check } from "lucide-react";

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function AvailabilityForm({
  open,
  onClose,
  darkMode,
  onSave,
}) {
  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  if (!open) return null;

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      selectedDays.length === 0 ||
      !startTime ||
      !endTime
    ) {
      return;
    }

    const formattedAvailability = selectedDays.map(
      (day) => ({
        id: Date.now() + Math.random(),
        day,
        startTime,
        endTime,
        status: "available",
      })
    );

    onSave(formattedAvailability);

    onClose();

    setSelectedDays([]);
    setStartTime("");
    setEndTime("");
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
          max-h-[95vh]
          overflow-y-auto
          rounded-t-3xl sm:rounded-3xl
          p-4 sm:p-6
          shadow-2xl
          ${
            darkMode
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-900"
          }
        `}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold">
              Manage Availability
            </h2>

            <p
              className={`text-xs sm:text-sm mt-1 ${
                darkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              }`}
            >
              Select your available days and hours
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-200/10 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 sm:space-y-6"
        >
          {/* DAYS */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Available Days
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {weekDays.map((day) => {
                const active =
                  selectedDays.includes(day);

                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`
                      flex items-center justify-center gap-1.5
                      min-h-[48px]
                      px-2 sm:px-4
                      py-2 sm:py-3
                      rounded-xl sm:rounded-2xl
                      text-xs sm:text-sm
                      font-medium
                      transition
                      break-words
                      text-center
                      ${
                        active
                          ? "bg-blue-600 text-white"
                          : darkMode
                          ? "bg-gray-800 text-gray-300 border border-gray-700"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
                      }
                    `}
                  >
                    {active && (
                      <Check className="w-4 h-4 flex-shrink-0" />
                    )}

                    <span className="leading-tight">
                      {day}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* HOURS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* START */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Start Time
              </label>

              <input
                type="time"
                value={startTime}
                onChange={(e) =>
                  setStartTime(e.target.value)
                }
                className={`
                  w-full
                  rounded-xl sm:rounded-2xl
                  border
                  px-3 sm:px-4
                  py-2.5 sm:py-3
                  text-sm
                  outline-none
                  ${
                    darkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-300"
                  }
                `}
              />
            </div>

            {/* END */}
            <div>
              <label className="block text-sm font-medium mb-2">
                End Time
              </label>

              <input
                type="time"
                value={endTime}
                onChange={(e) =>
                  setEndTime(e.target.value)
                }
                className={`
                  w-full
                  rounded-xl sm:rounded-2xl
                  border
                  px-3 sm:px-4
                  py-2.5 sm:py-3
                  text-sm
                  outline-none
                  ${
                    darkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-300"
                  }
                `}
              />
            </div>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            className="
              w-full
              bg-blue-600
              hover:bg-blue-700
              text-white
              py-3
              rounded-xl sm:rounded-2xl
              text-sm sm:text-base
              font-medium
              transition
            "
          >
            Save Availability
          </button>
        </form>
      </div>
    </div>
  );
}