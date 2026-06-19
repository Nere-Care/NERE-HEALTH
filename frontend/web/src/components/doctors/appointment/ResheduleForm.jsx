import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function RescheduleForm({
  open,
  onClose,
  selectedAppointment,
  darkMode,
  onSave,
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    if (selectedAppointment) {
      setDate("");
      setTime("");
    }
  }, [selectedAppointment]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    onSave(selectedAppointment.id, date, time);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">

      <div
        className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-xl ${
          darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold text-blue-500">
            Reschedule Appointment
          </h2>

          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient */}
        <p className="mb-4 text-sm opacity-70">
          Patient : {selectedAppointment?.patient}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`w-full border rounded-xl px-4 py-3 ${
              darkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300"
            }`}
          />

          <input
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={`w-full border rounded-xl px-4 py-3 ${
              darkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300"
            }`}
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700"
          >
            Save Changes
          </button>

        </form>
      </div>
    </div>
  );
}