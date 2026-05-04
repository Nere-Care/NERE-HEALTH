import { X, Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";

export default function NewAppointmentForm({ open, onClose, darkMode }) {
  const [formData, setFormData] = useState({
    patient: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    reason: "",
    type: "Consultation",
    location: "",
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

    // 👉 ici tu pourras :
    // - envoyer email (backend)
    // - sauvegarder côté patient

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

        {/* HEADER */}
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

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* PATIENT */}
          <input
            type="text"
            name="patient"
            placeholder="Patient name"
            value={formData.patient}
            onChange={handleChange}
            className={`w-full border rounded-xl px-4 py-3 outline-none ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-300"
            }`}
            required
          />

          {/* EMAIL */}
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="email"
              name="email"
              placeholder="Patient email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full pl-10 border rounded-xl px-4 py-3 outline-none ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-300"
              }`}
              required
            />
          </div>


          {/* DATE / TIME */}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`border rounded-xl px-4 py-3 ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-300"
              }`}
              required
            />

            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className={`border rounded-xl px-4 py-3 ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-300"
              }`}
              required
            />
          </div>

          {/* TYPE */}
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className={`w-full border rounded-xl px-4 py-3 ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-300"
            }`}
          >
            <option>Consultation</option>
            <option>Follow-up</option>
            <option>Emergency</option>
            <option>Teleconsultation</option>
          </select>

          {/* LOCATION */}
          {formData.type !== "Teleconsultation" && (
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="location"
                placeholder="Hospital / Clinic location"
                value={formData.location}
                onChange={handleChange}
                className={`w-full pl-10 border rounded-xl px-4 py-3 ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-300"
                }`}
                required
              />
            </div>
          )}

          {/* REASON */}
          <textarea
            name="reason"
            placeholder="Reason for consultation"
            value={formData.reason}
            onChange={handleChange}
            rows="3"
            className={`w-full border rounded-xl px-4 py-3 resize-none ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-300"
            }`}
          />

          {/* SUBMIT */}
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