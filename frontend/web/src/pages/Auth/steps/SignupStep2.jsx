import SelectInput from "../../../components/form/SelectInput";
import DateInput from "../../../components/form/DateInput";

import {
  doctorSpecialities,
  nurseSpecialities,
  cities,
  getDistrictsForCity,
} from "../../../constants/medicalOptions";

const sexes = ["Masculin", "Féminin", "Non précisé"];

export default function SignupStep2({
  selectedRole,
  ville,
  setVille,
  district,
  setDistrict,
  dateNaissance,
  setDateNaissance,
  specialite,
  setSpecialite,
  sexe,
  setSexe,
  onPatientSignUp,
  setStepThree,
  loading,
  errors,
  setErrors,
}) {
  const availableDistricts = getDistrictsForCity(ville);

  const handleCityChange = (e) => {
    setVille(e.target.value);
    setDistrict("");
  };

  const handleContinue = () => {
    setErrors({});
    if (selectedRole === "doctor" || selectedRole === "nurse") {
      if (!dateNaissance) {
        setErrors({ dateNaissance: "La date de naissance est requise" });
        return;
      }
      const birth = new Date(dateNaissance);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      if (age < 21) {
        setErrors({ dateNaissance: "Vous devez avoir au moins 21 ans pour vous inscrire en tant que professionnel de santé" });
        return;
      }
    }
    setStepThree(true);
  };

  return (
    <>
      <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">

        <div className="space-y-5">

          <SelectInput
            placeholder="Select City"
            options={cities}
            value={ville}
            onChange={handleCityChange}
            error={errors.ville}
          />

          <SelectInput
            placeholder="Select District"
            options={availableDistricts}
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            error={errors.district}
          />

          <DateInput
            label="Date de naissance"
            value={dateNaissance}
            onChange={(e) => setDateNaissance(e.target.value)}
            error={errors.dateNaissance}
          />

          {selectedRole === "patient" && (
            <>
              <SelectInput
                placeholder="Sexe"
                options={sexes}
                value={sexe}
                onChange={(e) => setSexe(e.target.value)}
                error={errors.sexe}
              />
            </>
          )}

          {selectedRole === "doctor" && (
            <SelectInput
              placeholder="Select Speciality"
              options={doctorSpecialities}
              value={specialite}
              onChange={(e) => setSpecialite(e.target.value)}
              error={errors.specialite}
            />
          )}

          {selectedRole === "nurse" && (
            <SelectInput
              placeholder="Select Speciality"
              options={nurseSpecialities}
              value={specialite}
              onChange={(e) => setSpecialite(e.target.value)}
              error={errors.specialite}
            />
          )}
        </div>

        {errors.api && (
          <p className="text-red-500 text-sm text-center mt-4">{errors.api}</p>
        )}

        {selectedRole === "patient" ? (
          <button
            disabled={loading}
            className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8] disabled:opacity-50"
            onClick={onPatientSignUp}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        ) : (
          <button
            onClick={handleContinue}
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