import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function PatientEditModal({ isOpen, onClose, patient, onSave, darkMode }) {
  const [form, setForm] = useState(patient || {});

  useEffect(() => {
    setForm(patient || {});
  }, [patient]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className={`w-[420px] rounded-2xl p-5 ${darkMode ? "bg-gray-800 text-white" : "bg-white"}`}>

        <div className="flex justify-between mb-4">
          <h2 className="font-bold">Modifier patient</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="flex flex-col gap-3">
          <input name="nom" value={form.nom || ""} onChange={handleChange} className="input" />
          <input name="age" value={form.age || ""} onChange={handleChange} className="input" />
          <input name="sexe" value={form.sexe || ""} onChange={handleChange} className="input" />
          <input name="telephone" value={form.telephone || ""} onChange={handleChange} className="input" />
          <input name="adresse" value={form.adresse || ""} onChange={handleChange} className="input" />
        </div>

        <button
          onClick={handleSave}
          className="w-full mt-4 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700"
        >
          Enregistrer
        </button>

      </div>
    </div>
  );
}