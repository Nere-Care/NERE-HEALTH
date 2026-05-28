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

  // SELECT / UNSELECT DAY
  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  // SAVE
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

    // RESET
    setSelectedDays([]);
    setStartTime("");
    setEndTime("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

      <div
        className={`w-full max-w-lg rounded-3xl p-6 ${
          darkMode
            ? "bg-gray-900 text-white"
            : "bg-white text-gray-900"
        }`}
      >

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">

          <div>
            <h2 className="text-xl font-bold">
              Manage Availability
            </h2>

            <p
              className={`text-sm mt-1 ${
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
            className="p-2 rounded-xl hover:bg-gray-200/10"
          >
            <X className="w-5 h-5" />
          </button>

        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* DAYS */}
          <div>

            <label className="block text-sm font-medium mb-3">
              Available Days
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

              {weekDays.map((day) => {
                const active =
                  selectedDays.includes(day);

                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`
                      flex items-center justify-center gap-2
                      px-4 py-3 rounded-2xl text-sm font-medium transition
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
                      <Check className="w-4 h-4" />
                    )}

                    {day}
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
                  w-full rounded-2xl border px-4 py-3 outline-none
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
                  w-full rounded-2xl border px-4 py-3 outline-none
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
              w-full bg-blue-600 hover:bg-blue-700
              text-white py-3 rounded-2xl
              font-medium transition
            "
          >
            Save Availability
          </button>

        </form>

      </div>
    </div>
  );
}