import { X, FileText, Eye, Download } from "lucide-react";
import { useState } from "react";

export default function PatientConsultationDetails({
  consultation,
  onClose,
  darkMode,
}) {
  const [previewFile, setPreviewFile] = useState(null);

  const prescriptions = consultation?.prescriptions || [];
  const labResults = consultation?.labResults || [];

  if (!consultation) return null;

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <div
        className={`hidden md:block w-[380px] border rounded-2xl p-5 shadow-sm sticky top-4 h-[90vh] overflow-y-auto overflow-x-hidden transition
        ${
          darkMode
            ? "bg-gray-900 border-gray-700 text-gray-200"
            : "bg-white border-gray-200 text-gray-700"
        }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
            Consultation Details
          </h3>

          <button
            onClick={onClose}
            className={`p-2 rounded-full border transition
            ${
              darkMode
                ? "bg-gray-800 border-gray-600 text-white"
                : "bg-[#DBF4D3] border-[#56B943] text-black"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* INFOS */}
        <div className="space-y-3 text-sm">
          <p><span className="font-medium">Reason:</span> {consultation.reason}</p>
          <p><span className="font-medium">Doctor:</span> {consultation.doctor}</p>
          <p><span className="font-medium">Diagnosis:</span> {consultation.diagnosis}</p>
          <p><span className="font-medium">Treatment:</span> {consultation.treatment}</p>
          <p><span className="font-medium">Date:</span> {consultation.date}</p>
          <p><span className="font-medium">Time:</span> {consultation.time}</p>
          <p><span className="font-medium">Notes:</span> {consultation.notes}</p>
        </div>

        {/* MEDICATIONS */}
        <div className="mt-6">
          <h4 className={`font-semibold mb-3 text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>
            Prescribed Medications
          </h4>

          <div className="space-y-2">
            {prescriptions.length > 0 ? (
              prescriptions.map((med) => (
                <div
                  key={med.id}
                  className={`border rounded-xl p-3 text-sm transition
                  ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <p className="font-medium">{med.name}</p>
                  <p className={darkMode ? "text-gray-300" : "text-gray-600"}>{med.dosage}</p>
                  <p className={darkMode ? "text-gray-300" : "text-gray-600"}>{med.frequency}</p>
                  <p className={darkMode ? "text-gray-300" : "text-gray-600"}>{med.duration}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No medication prescribed.</p>
            )}
          </div>
        </div>

        {/* LAB RESULTS */}
        <div className="mt-6">
          <h4 className={`font-semibold mb-3 text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>
            Laboratory Results
          </h4>

          <div className="space-y-2">
            {labResults.length > 0 ? (
              labResults.map((file) => (
                <div
                  key={file.id}
                  className={`border rounded-xl p-3 flex items-center justify-between transition
                  ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>{file.title}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewFile(file)}
                      className={`p-2 rounded-lg transition
                      ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <a
                      href={file.fileUrl}
                      download
                      className="p-2 rounded-lg bg-blue-600 text-white"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No laboratory file.</p>
            )}
          </div>
        </div>
      </div>

      {/* ================= MOBILE MODAL ================= */}
      <div className="md:hidden fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
        <div
          className={`w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-5 transition
          ${darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-700"}`}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
              Consultation Details
            </h3>

            <button
              onClick={onClose}
              className={`p-2 rounded-full border transition
              ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-[#DBF4D3] border-[#56B943] text-black"}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* INFOS */}
          <div className="space-y-3 text-sm">
            <p><span className="font-medium">Reason:</span> {consultation.reason}</p>
            <p><span className="font-medium">Doctor:</span> {consultation.doctor}</p>
            <p><span className="font-medium">Diagnosis:</span> {consultation.diagnosis}</p>
            <p><span className="font-medium">Treatment:</span> {consultation.treatment}</p>
            <p><span className="font-medium">Date:</span> {consultation.date}</p>
            <p><span className="font-medium">Time:</span> {consultation.time}</p>
            <p><span className="font-medium">Notes:</span> {consultation.notes}</p>
          </div>

          {/* MEDICATIONS (MOBILE) */}
          <div className="mt-6">
            <h4 className={`font-semibold mb-3 text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>
              Prescribed Medications
            </h4>

            <div className="space-y-2">
              {prescriptions.length > 0 ? (
                prescriptions.map((med) => (
                  <div
                    key={med.id}
                    className={`border rounded-xl p-3 text-sm transition
                    ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                  >
                    <p className="font-medium">{med.name}</p>
                    <p className={darkMode ? "text-gray-300" : "text-gray-600"}>{med.dosage}</p>
                    <p className={darkMode ? "text-gray-300" : "text-gray-600"}>{med.frequency}</p>
                    <p className={darkMode ? "text-gray-300" : "text-gray-600"}>{med.duration}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No medication prescribed.</p>
              )}
            </div>
          </div>

          {/* LAB RESULTS (MOBILE) */}
          <div className="mt-6 mb-10">
            <h4 className={`font-semibold mb-3 text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>
              Laboratory Results
            </h4>

            <div className="space-y-2">
              {labResults.length > 0 ? (
                labResults.map((file) => (
                  <div
                    key={file.id}
                    className={`border rounded-xl p-3 flex items-center justify-between transition
                    ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>{file.title}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setPreviewFile(file)}
                        className={`p-2 rounded-lg transition
                        ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <a
                        href={file.fileUrl}
                        download
                        className="p-2 rounded-lg bg-blue-600 text-white"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No laboratory file.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* POPUP PREVIEW */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-5">
          <div
            className={`rounded-2xl w-full max-w-3xl h-[85vh] overflow-hidden shadow-xl transition
            ${darkMode ? "bg-gray-900" : "bg-white"}`}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {previewFile.title}
              </h3>

              <button
                onClick={() => setPreviewFile(null)}
                className={`p-2 rounded-full transition
                ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <iframe src={previewFile.fileUrl} className="w-full h-full" />
          </div>
        </div>
      )}
    </>
  );
}