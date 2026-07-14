import { useState, useEffect } from "react";
import { AlertCircle, Calendar } from "lucide-react";
import SelectInput from "../../../components/form/SelectInput";
import { doctorSpecialities, nurseSpecialities, cities, getDistrictsByCity } from "../../../constants/medicalOptions";
import { validateAge } from "../../../utils/validation";

export default function SignupStep2({
  saveUser, navigate, redirectByRole, setStepThree,
  updateForm, formData, handleSubmit, errors = {}, loading
}) {
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [dobError, setDobError] = useState(null);

  useEffect(() => {
    if (formData.city) {
      const districts = getDistrictsByCity(formData.city);
      setAvailableDistricts(districts);
      if (formData.district && !districts.includes(formData.district)) {
        updateForm("district", "");
      }
    } else {
      setAvailableDistricts([]);
    }
  }, [formData.city]);

  const handleDobChange = (val) => {
    updateForm("dob", val);
    const err = validateAge(val);
    setDobError(err);
  };

  return (
    <>
      <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">
        <div className="space-y-5">
          {/* VILLE */}
          <div>
            <SelectInput
              placeholder="Select City"
              options={cities}
              value={formData.city || ""}
              onChange={(val) => updateForm("city", val)}
            />
            {errors.city && (
              <p className="text-red-500 text-xs mt-1 ml-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.city}
              </p>
            )}
          </div>

          {/* DISTRICT */}
          <div>
            <SelectInput
              placeholder={formData.city ? "Select District" : "Select a city first"}
              options={availableDistricts}
              value={formData.district || ""}
              onChange={(val) => updateForm("district", val)}
              disabled={!formData.city}
            />
            {errors.district && (
              <p className="text-red-500 text-xs mt-1 ml-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.district}
              </p>
            )}
          </div>

          {/* DATE DE NAISSANCE */}
          <div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={formData.dob || ""}
                onChange={(e) => handleDobChange(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none transition
                  ${dobError || errors.dob ? "border-red-400 bg-red-50" : "border-gray-200 bg-white focus:border-blue-500"}`}
              />
            </div>
            {(dobError || errors.dob) && (
              <p className="text-red-500 text-xs mt-1 ml-1">{dobError || errors.dob}</p>
            )}
          </div>

          {/* SPÉCIALITÉ (doctor/nurse) */}
          {(formData.role === "doctor" || formData.role === "nurse") && (
            <div>
              <SelectInput
                placeholder="Select Speciality"
                options={formData.role === "doctor" ? doctorSpecialities : nurseSpecialities}
                value={formData.speciality || ""}
                onChange={(val) => updateForm("speciality", val)}
              />
              {errors.speciality && (
                <p className="text-red-500 text-xs mt-1 ml-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.speciality}
                </p>
              )}
            </div>
          )}
        </div>

        {/* BOUTON */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium disabled:opacity-50"
        >
          {loading 
            ? "Traitement..." 
            : formData.role === "patient" 
              ? "Sign Up" 
              : "Continue"}
        </button>
      </div>

      <p className="text-sm mt-8 text-center text-gray-600">
        Already have an account?{" "}
        <span
          onClick={() => setStepThree(false)}
          className="text-[#2F80ED] cursor-pointer font-medium hover:underline"
        >
          Login
        </span>
      </p>
    </>
  );
}