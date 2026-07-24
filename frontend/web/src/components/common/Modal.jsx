import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, darkMode, size = "max-w-sm" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className={`rounded-2xl p-6 w-full ${size} mx-4 shadow-2xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{title}</h3>
          <button onClick={onClose} className={`p-1 rounded-lg transition ${darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
