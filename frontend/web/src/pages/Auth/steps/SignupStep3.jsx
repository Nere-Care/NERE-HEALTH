import { AlertCircle, FileText, User, Upload, X } from "lucide-react";
import SelectInput from "../../../components/form/SelectInput";
import ExperienceInput from "../../../components/form/ExperienceInput";
import { VALIDATIONS } from "../../../utils/validation";

export default function SignupStep3({
  hospitals, handleSubmit, resetToLogin, updateForm, formData, errors = {}, loading
}) {
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    updateForm("files", files);
  };

  const removeFile = (index) => {
    const newFiles = formData.files.filter((_, i) => i !== index);
    updateForm("files", newFiles);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <>
      <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">
        <div className="space-y-5">
          {/* STRUCTURE */}
          <div>
            <SelectInput
              placeholder="Select Health Structure"
              options={hospitals}
              value={formData.hospital || ""}
              onChange={(val) => updateForm("hospital", val)}
            />
            {errors.hospital && (
              <p className="text-red-500 text-xs mt-1 ml-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.hospital}
              </p>
            )}
          </div>

          {/* NUMÉRO D'INSCRIPTION */}
          <div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                placeholder="Professional Registration Number"
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
              Degree and certification (PDF, JPG, PNG - max {VALIDATIONS.FILE_MAX_SIZE_MB} MB)
            </p>

            <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition
              ${errors.files ? "border-red-300 bg-red-50" : "border-blue-300 bg-blue-50"}`}>
              <Upload className={`w-16 h-16 mx-auto mb-4 ${errors.files ? "text-red-300" : "text-blue-300"}`} />

              <label className="inline-block bg-[#2F80ED] hover:bg-[#044EC8] transition text-white px-10 py-3 rounded-xl cursor-pointer font-medium shadow-md">
                Choose File
                <input
                  type="file"
                  hidden
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              </label>

              <p className="text-sm text-gray-500 mt-4">
                Upload your certifications and professional documents
              </p>

              {/* Liste des fichiers */}
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
              The file must be readable and authentic
            </p>
          </div>
        </div>

        {/* BOUTON */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          {loading ? "Création du compte..." : "Submit"}
        </button>
      </div>

      <p className="text-sm mt-8 text-center text-gray-600">
        Already have an account?{" "}
        <span onClick={resetToLogin} className="text-[#2F80ED] cursor-pointer font-medium hover:underline">
          Login
        </span>
      </p>
    </>
  );
}