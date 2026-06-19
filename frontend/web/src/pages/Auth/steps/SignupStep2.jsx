import SelectInput from "../../../components/form/SelectInput";
import DateInput from "../../../components/form/DateInput";

import {
  doctorSpecialities,
  nurseSpecialities,
  cities,
  districts,
} from "../../../constants/medicalOptions";

export default function SignupStep2({
  selectedRole,
  saveUser,
  navigate,
  redirectByRole,
  setStepThree,
}) {
  return (
    <>
      <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">

        <div className="space-y-5">

          <SelectInput placeholder="Select City" options={cities} />

          <SelectInput placeholder="Select District" options={districts} />

          {selectedRole === "patient" && <DateInput />}

          {selectedRole === "doctor" && (
            <>
              <SelectInput
                placeholder="Select Speciality"
                options={doctorSpecialities}
              />
              <DateInput />
            </>
          )}

          {selectedRole === "nurse" && (
            <>
              <SelectInput
                placeholder="Select Speciality"
                options={nurseSpecialities}
              />
              <DateInput />
            </>
          )}
        </div>

        {selectedRole === "patient" ? (
          <button
            className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8]"
            onClick={() => {
              const user = {
                role: selectedRole,
                email: "user@email.com",
              };

              saveUser(user);
              navigate(redirectByRole(user.role));
            }}
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