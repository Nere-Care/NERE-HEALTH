import { X } from "lucide-react";
import { useState } from "react";

export default function AskOpinionModal({
  darkMode,
  doctor,
  onClose,
  onSend,
}) {
  const [message, setMessage] = useState("");

  if (!doctor) return null;

  const handleSubmit = () => {
    if (!message.trim()) return;

    onSend({
      doctorId: doctor.id,
      doctorName: doctor.name,
      message,
    });

    setMessage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={`w-full max-w-lg p-5 rounded-2xl shadow-lg relative
        ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}
      >
        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3"
        >
          <X />
        </button>

        {/* TITLE */}
        <h2 className="text-lg font-semibold mb-2">
          Ask opinion from {doctor.name}
        </h2>

        <p className="text-xs text-gray-400 mb-4">
          Doctor ID: {doctor.id}
        </p>

        {/* TEXTAREA */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your medical question..."
          className={`w-full h-32 p-3 rounded-xl border outline-none
          ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-white"
              : "bg-gray-100 border-gray-200"
          }`}
        />

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700"
        >
          Send message
        </button>
      </div>
    </div>
  );
}