import { useState } from "react";
import { AlertCircle, FileText, User, Upload, X, Building2, ArrowLeft } from "lucide-react";
import SelectInput from "../../../components/form/SelectInput";
import ExperienceInput from "../../../components/form/ExperienceInput";
import { VALIDATIONS } from "../../../utils/validation";

export default function SignupStep3({
  hospitals, handleSubmit, resetToLogin, updateForm, formData, errors = {}, loading
}) {
  const [modeManuel, setModeManuel] = useState(false);

  // ── Fichiers : fusionne les nouveaux avec ceux deja selectionnes ─────────
  const handleFileChange = (e) => {
    const nouveauxFichiers = Array.from(e.target.files);
    if (nouveauxFichiers.length === 0) return;

    const fichiersExistants = formData.files || [];
    // Eviter les doublons (meme nom + meme taille)
    const cles = new Set(fichiersExistants.map((f) => `${f.name}_${f.size}`));
    const fichiersAAjouter = nouveauxFichiers.filter((f) => !cles.has(`${f.name}_${f.size}`));

    updateForm("files", [...fichiersExistants, ...fichiersAAjouter]);

    // Reinitialiser l'input pour pouvoir re-selectionner un fichier plus tard si besoin
    e.target.value = "";
  };

  const removeFile = (index) => {
    const newFiles = formData.files.filter((_, i) => i !== index);
    updateForm("files", newFiles);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} O`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  // ── Structure de sante : bascule liste / saisie manuelle ─────────────────
  const activerModeManuel = () => {
    setModeManuel(true);
    updateForm("hospital", "");
  };

  const revenirALaListe = () => {
    setModeManuel(false);
    updateForm("hospital", "");
  };

  return (
    <>
      <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">
        <div className="space-y-5">

          {/* STRUCTURE */}
          <div>
            {!modeManuel ? (
              <>
                <SelectInput
                  placeholder="Sélectionnez une structure de santé"
                  options={hospitals}
                  value={formData.hospital || ""}
                  onChange={(val) => updateForm("hospital", val)}
                />
                <button
                  type="button"
                  onClick={activerModeManuel}
                  className="text-xs text-[#2F80ED] hover:underline mt-1.5 ml-1"
                >
                  Ma structure n'est pas dans la liste
                </button>
              </>
            ) : (
              <>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    placeholder="Nom de votre structure de santé"
                    value={formData.hospital || ""}
                    onChange={(e) => updateForm("hospital", e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none transition
                      ${errors.hospital ? "border-red-400 bg-red-50" : "border-gray-200 bg-white focus:border-blue-500"}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={revenirALaListe}
                  className="flex items-center gap-1 text-xs text-[#2F80ED] hover:underline mt-1.5 ml-1"
                >
                  <ArrowLeft size={12} /> Choisir dans la liste
                </button>
              </>
            )}
            {errors.hospital && (
              <p className="text-red-500 text-xs mt-1 ml-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.hospital}
              </p>
            )}
          </div>

          {/* NUMÉRO D'ORDRE */}
          <div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                placeholder="Numéro d'ordre professionnel"
                value={formData.registrationNumber || ""}
                onChange={(e) => updateForm("registrationNumber", e.target.value)}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none transition
                  ${errors.registrationNumber ? "border-red-400 bg-red-50" : "border-gray-200 bg-white focus:border-blue-500"}`}
              />
            </div>
            {errors.registrationNumber && (
              <p className="text-red-500 text-xs mt-1 ml-1">{errors.registrationNumber}</p>
            )}
          </div>

          {/* EXPÉRIENCE */}
          <div>
            <ExperienceInput
              value={formData.experience}
              setValue={(val) => updateForm("experience", val)}
            />
            {errors.experience && (
              <p className="text-red-500 text-xs mt-1 ml-1">{errors.experience}</p>
            )}
          </div>

          {/* UPLOAD FICHIERS */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              Diplôme et certifications (PDF, JPG, PNG - max {VALIDATIONS.FILE_MAX_SIZE_MB} Mo)
            </p>

            <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition
              ${errors.files ? "border-red-300 bg-red-50" : "border-blue-300 bg-blue-50"}`}>
              <Upload className={`w-16 h-16 mx-auto mb-4 ${errors.files ? "text-red-300" : "text-blue-300"}`} />

              <label className="inline-block bg-[#2F80ED] hover:bg-[#044EC8] transition text-white px-10 py-3 rounded-xl cursor-pointer font-medium shadow-md">
                Choisir des fichiers
                <input
                  type="file"
                  hidden
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              </label>

              <p className="text-sm text-gray-500 mt-4">
                Vous pouvez sélectionner plusieurs fichiers à la fois, ou ajouter d'autres documents en cliquant à nouveau
              </p>

              {formData.files && formData.files.length > 0 && (
                <div className="mt-4 text-left bg-white rounded-xl p-4 border border-blue-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {formData.files.length} fichier(s) sélectionné(s) :
                  </p>
                  <ul className="space-y-2">
                    {formData.files.map((file, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText size={14} className="text-blue-500 flex-shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-xs text-gray-400">{formatSize(file.size)}</span>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {errors.files && (
              <p className="text-red-500 text-xs mt-1 ml-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.files}
              </p>
            )}

            <p className="text-sm text-[#B97A2B] mt-3">
              Le fichier doit être lisible et authentique
            </p>
          </div>
        </div>

        {/* BOUTON */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          {loading ? "Création du compte..." : "Valider mon inscription"}
        </button>
      </div>

      <p className="text-sm mt-8 text-center text-gray-600">
        Vous avez déjà un compte ?{" "}
        <span onClick={resetToLogin} className="text-[#2F80ED] cursor-pointer font-medium hover:underline">
          Se connecter
        </span>
      </p>
    </>
  );
}