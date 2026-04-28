import { X } from "lucide-react";
import { useState } from "react";

export default function NewAppointmentForm({ open, onClose, darkMode }) {
  const [formData, setFormData] = useState({
    patient: "",
    date: "",
    time: "",
    reason: "",
    type: "Consultation",
  });

  if (!open) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log(formData);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      
      <div
        className={`w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 shadow-xl border transition-all duration-300 ${
          darkMode
            ? "bg-gray-900 text-white border-gray-700"
            : "bg-white text-gray-900 border-gray-200"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold text-blue-500">
            New Appointment
          </h2>

          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition ${
              darkMode
                ? "hover:bg-gray-800 text-gray-300"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            name="patient"
            placeholder="Patient name"
            value={formData.patient}
            onChange={handleChange}
            className={`w-full border rounded-xl px-4 py-3 outline-none transition ${
              darkMode
                ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
            }`}
            required
          />

          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={`w-full border rounded-xl px-4 py-3 outline-none transition ${
              darkMode
                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
            }`}
            required
          />

          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            className={`w-full border rounded-xl px-4 py-3 outline-none transition ${
              darkMode
                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
            }`}
            required
          />

          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className={`w-full border rounded-xl px-4 py-3 outline-none transition ${
              darkMode
                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
            }`}
          >
            <option>Consultation</option>
            <option>Follow-up</option>
            <option>Emergency</option>
          </select>

          <textarea
            name="reason"
            placeholder="Reason"
            value={formData.reason}
            onChange={handleChange}
            rows="3"
            className={`w-full border rounded-xl px-4 py-3 outline-none transition resize-none ${
              darkMode
                ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
            }`}
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-medium"
          >
            Create Appointment
          </button>

        </form>
      </div>
    </div>
  );
}