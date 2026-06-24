import { useState, useEffect } from "react";
import SelectInput from "../../../components/form/SelectInput";
import DateInput from "../../../components/form/DateInput";
import {
  doctorSpecialities,
  nurseSpecialities,
  cities,
  getDistrictsByCity,
} from "../../../constants/medicalOptions";

export default function SignupStep2({
  saveUser,
  navigate,
  redirectByRole,
  setStepThree,
  updateForm,
  formData,
  handleSubmit,
}) {
  // État local pour les districts filtrés par ville
  const [availableDistricts, setAvailableDistricts] = useState([]);

  // Mettre à jour les districts quand la ville change
  useEffect(() => {
    if (formData.city) {
      setAvailableDistricts(getDistrictsByCity(formData.city));
      // Réinitialiser le district si la ville change
      if (formData.district && !getDistrictsByCity(formData.city).includes(formData.district)) {
        updateForm("district", "");
      }
    } else {
      setAvailableDistricts([]);
    }
  }, [formData.city]);

  return (
    <>
      <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">
        <div className="space-y-5">

          <SelectInput
            placeholder="Select City"
            options={cities}
            value={formData.city || ""}
            onChange={(val) => {
              console.log("CITY SELECTED:", val);
              updateForm("city", val);
            }}
          />

          <SelectInput
            placeholder={formData.city ? "Select District" : "Select a city first"}
            options={availableDistricts}
            value={formData.district || ""}
            onChange={(val) => updateForm("district", val)}
            disabled={!formData.city}
          />

          {formData.role === "patient" && (
            <DateInput onChange={(val) => updateForm("dob", val)} />
          )}

          {formData.role === "doctor" && (
            <>
              <SelectInput
                placeholder="Select Speciality"
                options={doctorSpecialities}
                onChange={(val) => updateForm("speciality", val)}
              />
              <DateInput onChange={(val) => updateForm("dob", val)} />
            </>
          )}

          {formData.role === "nurse" && (
            <>
              <SelectInput
                placeholder="Select Speciality"
                options={nurseSpecialities}
                onChange={(val) => updateForm("speciality", val)}
              />
              <DateInput onChange={(val) => updateForm("dob", val)} />
            </>
          )}
        </div>

        {formData.role === "patient" ? (
          <button
            className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8]"
            onClick={handleSubmit}
          >
            Sign Up
          </button>
        ) : (
          <button
            onClick={() => setStepThree(true)}
            className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8]"
          >
            Continue
          </button>
        )}
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