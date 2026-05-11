import { useState } from "react";
import { X } from "lucide-react";

export default function PatientAddModal({ isOpen, onClose, onAdd, darkMode }) {
  const [form, setForm] = useState({
    nom: "",
    age: "",
    sexe: "",
    telephone: "",
    adresse: "",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onAdd(form);
    setForm({ nom: "", age: "", sexe: "", telephone: "", adresse: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className={`w-[420px] rounded-2xl p-5 shadow-lg ${darkMode ? "bg-gray-800 text-white" : "bg-white"}`}>

        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Ajouter un patient</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <input name="nom" placeholder="Nom complet" onChange={handleChange} className="input" />
          <input name="age" placeholder="Âge" onChange={handleChange} className="input" />
          <input name="sexe" placeholder="Sexe" onChange={handleChange} className="input" />
          <input name="telephone" placeholder="Téléphone" onChange={handleChange} className="input" />
          <input name="adresse" placeholder="Adresse" onChange={handleChange} className="input" />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full mt-4 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}