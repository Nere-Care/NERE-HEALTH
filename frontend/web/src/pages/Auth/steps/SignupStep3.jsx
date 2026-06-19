import SelectInput from "../../../components/form/SelectInput";
import Input from "../../../components/form/Input";
import ExperienceInput from "../../../components/form/ExperienceInput";
import { FileText, User } from "lucide-react";

export default function SignupStep3({
  hospitals,
  experience,
  setExperience,
  handleSubmit,
  resetToLogin,
}) {
  return (
    <>
      <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">

        <div className="space-y-5">

          <SelectInput
            placeholder="Select Health Structure"
            options={hospitals}
          />

          <Input
            icon={<User className="w-5 h-5 text-gray-500" />}
            placeholder="Professional Registration Number"
          />

          <ExperienceInput
            value={experience}
            setValue={setExperience}
          />

          {/* ================= UPLOAD ================= */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              Degree and certification (Pdf, Jpg, PNG)
            </p>

            <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-2xl p-8 text-center">

              <FileText className="w-20 h-20 mx-auto text-blue-300 mb-4" />

              <label className="inline-block bg-[#2F80ED] hover:bg-[#044EC8] transition text-white px-10 py-3 rounded-xl cursor-pointer font-medium shadow-md">
                Choose File
                <input type="file" hidden multiple />
              </label>

              <p className="text-sm text-gray-500 mt-4">
                Upload your certifications and professional documents
              </p>
            </div>

            <p className="text-sm text-[#B97A2B] mt-3">
              The file must be readable and authentic
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100"
        >
          Submit
        </button>
      </div>

      {/* FOOTER */}
      <p className="text-sm mt-8 text-center text-gray-600">
        Already have an account?{" "}
        <span
          onClick={resetToLogin}
          className="text-[#2F80ED] cursor-pointer font-medium hover:underline"
        >
          Login
        </span>
      </p>
    </>
  );
}