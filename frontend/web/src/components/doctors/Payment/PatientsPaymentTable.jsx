import {
  Download,
  Eye,
  FileText,
} from "lucide-react";
import { generateDoctorConsultationReceiptPDF, generateSequestreReceiptPDF } from "../../../utils/receiptGenerator";

/* ================= EXPORT EXCEL ================= */

const exportToExcel = (
  data,
  filename = "paiements"
) => {
  if (!data?.length) {
    alert("No data to export");
    return;
  }

  const headers = [
    "Patient",
    "N° Patient",
    "Matricule",
    "Service",
    "Date",
    "Montant",
    "Methode",
    "Statut",
  ];

  const rows = data.map((p) => [
    p.patient || "",
    p.patientCode || "",
    p.matricule || "",
    p.service || "",
    p.date || "",
    p.amount || "",
    p.method || "",
    p.status || "",
  ]);

  const htmlTable = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Paiements</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        th { background: #1a56db; color: white; font-weight: bold; padding: 8px 12px; }
        td { padding: 6px 12px; border: 1px solid #ddd; }
        tr:nth-child(even) { background: #f3f4f6; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map(row => `<tr>${row.map(cell => `<td>${String(cell).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(["\uFEFF" + htmlTable], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/* ================= COMPONENT ================= */

export default function PatientsPaymentsTable({
  payments,
  darkMode,
  onViewDetails,
  onExport,
  doctorName,
}) {

  /* ================= STATUS BADGES ================= */

  const getStatusBadge = (
    status
  ) => {

    const styles = {

      Paid:
        "bg-green-500 text-white",

      Pending:
        "bg-yellow-500 text-white",

      Failed:
        "bg-red-500 text-white",

      Refunded:
        "bg-blue-500 text-white",

      Retenu:
        "bg-amber-500 text-white",
    };

    return (
      styles[status] ||
      "bg-gray-400 text-white"
    );
  };

  /* ================= HELPERS ================= */

  const formatMatricule = (
    id
  ) =>
    `PAT-${String(id).padStart(
      4,
      "0"
    )}`;

  const handleExport = () => {

    if (onExport) {
      onExport();
    }

    exportToExcel(
      payments,
      "paiements"
    );
  };

  const handleView = (
    payment,
    e
  ) => {

    e?.stopPropagation();

    onViewDetails?.(payment);
  };

  const handleReceipt = (payment, e) => {
    e?.stopPropagation();
    if (payment.type_paiement === "sequestre_avis") {
      generateSequestreReceiptPDF(payment, doctorName);
    } else {
      generateDoctorConsultationReceiptPDF(payment, doctorName);
    }
  };

  return (

    <div
      className={`
        rounded-2xl
        border
        overflow-hidden
        transition-all
        duration-300
        ${
          darkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }
      `}
    >

      {/* ================= HEADER ================= */}

      <div
        className={`
          p-4 sm:p-5
          border-b
          flex
          flex-col
          lg:flex-row
          lg:items-center
          lg:justify-between
          gap-4
          ${
            darkMode
              ? "border-gray-700"
              : "border-gray-200"
          }
        `}
      >

        {/* LEFT */}

        <div className="min-w-0">

          <h2 className="font-semibold text-lg sm:text-xl truncate">
           Payments
          </h2>

          <p
            className={`
              text-xs sm:text-sm
              mt-1
              ${
                darkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              }
            `}
          >
            All transactions
          </p>

        </div>

        {/* BUTTON */}

        <button
          onClick={handleExport}
          className="
            flex items-center justify-center gap-2
            bg-blue-600 hover:bg-blue-700
            text-white
            px-4 py-3
            rounded-xl
            text-sm font-medium
            transition
            min-h-[48px]
            w-full sm:w-auto
            whitespace-nowrap
          "
        >

          <Download className="w-4 h-4" />

          Export Excel

        </button>

      </div>

      {/* ================= MOBILE CARDS ================= */}

      <div className="block lg:hidden p-4 space-y-4">

        {payments?.length ? (

          payments.map((p) => (

            <div
              key={p.id}
              onClick={(e) =>
                handleView(p, e)
              }
              className={`
                rounded-2xl
                border
                p-4
                cursor-pointer
                transition-all
                ${
                  darkMode
                    ? "bg-gray-900 border-gray-700 hover:bg-gray-800"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }
              `}
            >

              {/* TOP */}

              <div className="flex items-start justify-between gap-3">

                <div className="flex items-center gap-3 min-w-0">

                  <div
                    className={`
                      w-10 h-10
                      rounded-full
                      flex items-center justify-center
                      text-sm font-bold
                      flex-shrink-0
                      ${
                        darkMode
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-200 text-gray-600"
                      }
                    `}
                  >
                    {p.patient?.[0] || "P"}
                  </div>

                  <div className="min-w-0">

                    <p className="font-semibold text-sm truncate">
                      {p.patient}
                    </p>

                    <p
                      className={`
                        text-[11px]
                        ${
                          darkMode
                            ? "text-gray-400"
                            : "text-gray-500"
                        }
                      `}
                    >
                      {p.service}
                    </p>

                  </div>

                </div>

                <span
                  className={`
                    inline-flex
                    px-2.5 py-1
                    rounded-full
                    text-[10px]
                    font-medium
                    whitespace-nowrap
                    ${getStatusBadge(
                      p.status
                    )}
                  `}
                >
                  {p.status}
                </span>

              </div>

              {/* MIDDLE */}

              <div className="mt-4 space-y-2 text-sm">

                {p.patientCode && (
                  <div className="flex justify-between gap-4">
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                      N° Patient
                    </span>
                    <code className={`text-[10px] px-2 py-1 rounded font-mono ${darkMode ? "bg-gray-700 text-purple-300" : "bg-gray-100 text-purple-700"}`}>
                      {p.patientCode}
                    </code>
                  </div>
                )}

                {p.matricule && (
                  <div className="flex justify-between gap-4">
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                      Matricule
                    </span>
                    <code className={`text-[10px] px-2 py-1 rounded font-mono ${darkMode ? "bg-gray-700 text-blue-300" : "bg-gray-100 text-blue-700"}`}>
                      {p.matricule}
                    </code>
                  </div>
                )}

                <div className="flex justify-between gap-4">

                  <span
                    className={
                      darkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }
                  >
                    Amount
                  </span>

                  <span className="font-semibold">
                    {p.amount}
                  </span>

                </div>

                <div className="flex justify-between gap-4">

                  <span
                    className={
                      darkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }
                  >
                    Method
                  </span>

                  <span>
                    {p.method}
                  </span>

                </div>

                <div className="flex justify-between gap-4">

                  <span
                    className={
                      darkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }
                  >
                    Date
                  </span>

                  <span>
                    {p.date}
                  </span>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="mt-5 flex gap-2">

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleView(p, e);
                  }}
                  className={`
                    flex-1
                    flex items-center justify-center gap-2
                    py-3 rounded-xl
                    text-sm font-medium
                    transition
                    min-h-[44px]
                    ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }
                  `}
                >

                  <Eye className="w-4 h-4" />

                  View

                </button>

                <button
                  onClick={(e) =>
                    handleReceipt(
                      p,
                      e
                    )
                  }
                  className="
                    flex-1
                    flex items-center justify-center gap-2
                    bg-blue-600 hover:bg-blue-700
                    text-white
                    py-3 rounded-xl
                    text-sm font-medium
                    transition
                    min-h-[44px]
                  "
                >

                  <Download className="w-4 h-4" />

                  Receipt

                </button>

              </div>

            </div>

          ))

        ) : (

          <div
            className={`
              flex flex-col items-center justify-center
              py-12 px-4
              text-center
              ${
                darkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              }
            `}
          >

            <div
              className={`
                w-14 h-14
                rounded-full
                flex items-center justify-center
                mb-4
                ${
                  darkMode
                    ? "bg-gray-700"
                    : "bg-gray-100"
                }
              `}
            >

              <FileText className="w-6 h-6" />

            </div>

            <p className="font-medium">
              No payments found
            </p>

          </div>

        )}

      </div>

      {/* ================= DESKTOP TABLE ================= */}

      <div className="hidden lg:block overflow-x-auto">

        <table className="w-full min-w-[900px] text-sm">

          <thead
            className={`
              text-xs uppercase
              ${
                darkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              }
            `}
          >

            <tr
              className={`
                border-b
                ${
                  darkMode
                    ? "border-gray-700"
                    : "border-gray-200"
                }
              `}
            >

              <th className="text-left py-4 px-5 font-medium">
                Patient
              </th>

              <th className="text-left py-4 px-5 font-medium">
                N° Patient
              </th>

              <th className="text-left py-4 px-5 font-medium">
                Matricule
              </th>

              <th className="text-left py-4 px-5 font-medium">
                Service
              </th>

              <th className="text-left py-4 px-5 font-medium">
                Date
              </th>

              <th className="text-left py-4 px-5 font-medium">
                Amount
              </th>

              <th className="text-left py-4 px-5 font-medium">
                Method
              </th>

              <th className="text-left py-4 px-5 font-medium">
                Status
              </th>

              <th className="text-right py-4 px-5 font-medium">
                Actions
              </th>

            </tr>

          </thead>

          <tbody
            className={
              darkMode
                ? "divide-y divide-gray-700"
                : "divide-y divide-gray-200"
            }
          >

            {payments?.length ? (

              payments.map((p) => (

                <tr
                  key={p.id}
                  onClick={(e) =>
                    handleView(p, e)
                  }
                  className={`
                    cursor-pointer transition
                    ${
                      darkMode
                        ? "hover:bg-gray-700/50"
                        : "hover:bg-gray-50"
                    }
                  `}
                >

                  {/* PATIENT */}

                  <td className="py-4 px-5">

                    <div className="flex items-center gap-3">

                      <div
                        className={`
                          w-9 h-9
                          rounded-full
                          flex items-center justify-center
                          text-xs font-bold
                          flex-shrink-0
                          ${
                            darkMode
                              ? "bg-gray-700 text-gray-300"
                              : "bg-gray-200 text-gray-600"
                          }
                        `}
                      >
                        {p.patient?.[0] ||
                          "P"}
                      </div>

                      <div>

                        <p className="font-medium">
                          {p.patient}
                        </p>

                        {p.patientName && p.patientName !== p.patient && (
                          <p
                            className={`
                              text-[11px]
                              ${
                                darkMode
                                  ? "text-gray-400"
                                  : "text-gray-500"
                              }
                            `}
                          >
                            {p.patientName}
                          </p>
                        )}

                      </div>

                    </div>

                  </td>

                  {/* N° PATIENT */}

                  <td className="py-4 px-5">
                    <code
                      className={`
                        text-[11px]
                        px-2 py-1
                        rounded
                        font-mono
                        ${
                          darkMode
                            ? "bg-gray-700 text-purple-300"
                            : "bg-gray-100 text-purple-700"
                        }
                      `}
                    >
                      {p.patientCode || "-"}
                    </code>
                  </td>

                  {/* MATRICULE */}

                  <td className="py-4 px-5">
                    <code
                      className={`
                        text-[11px]
                        px-2 py-1
                        rounded
                        font-mono
                        ${
                          darkMode
                            ? "bg-gray-700 text-blue-300"
                            : "bg-gray-100 text-blue-700"
                        }
                      `}
                    >
                      {p.matricule || "-"}
                    </code>
                  </td>

                  {/* SERVICE */}

                  <td className="py-4 px-5">
                    {p.service}
                  </td>

                  {/* DATE */}

                  <td className="py-4 px-5">
                    {p.date}
                  </td>

                  {/* AMOUNT */}

                  <td className="py-4 px-5 font-semibold">
                    {p.amount}
                  </td>

                  {/* METHOD */}

                  <td className="py-4 px-5">
                    {p.method}
                  </td>

                  {/* STATUS */}

                  <td className="py-4 px-5">

                    <span
                      className={`
                        inline-flex
                        px-3 py-1
                        rounded-full
                        text-[11px]
                        font-medium
                        whitespace-nowrap
                        ${getStatusBadge(
                          p.status
                        )}
                      `}
                    >
                      {p.status}
                    </span>

                  </td>

                  {/* ACTIONS */}

                  <td className="py-4 px-5">

                    <div className="flex items-center justify-end gap-2">

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(
                            p,
                            e
                          );
                        }}
                        className={`
                          p-2 rounded-lg transition
                          ${
                            darkMode
                              ? "hover:bg-gray-700"
                              : "hover:bg-gray-100"
                          }
                        `}
                      >

                        <Eye className="w-4 h-4" />

                      </button>

                      <button
                        onClick={(e) =>
                          handleReceipt(
                            p,
                            e
                          )
                        }
                        className="
                          bg-blue-600 hover:bg-blue-700
                          text-white
                          px-3 py-2
                          rounded-lg
                          text-xs
                          flex items-center gap-2
                          transition
                        "
                      >

                        <Download className="w-3 h-3" />

                        Receipt

                      </button>

                    </div>

                  </td>

                </tr>

              ))

            ) : (

              <tr>

                <td
                  colSpan={9}
                  className={`
                    text-center py-16
                    ${
                      darkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }
                  `}
                >

                  <div className="flex flex-col items-center gap-3">

                    <div
                      className={`
                        w-14 h-14
                        rounded-full
                        flex items-center justify-center
                        ${
                          darkMode
                            ? "bg-gray-700"
                            : "bg-gray-100"
                        }
                      `}
                    >

                      <FileText className="w-6 h-6" />

                    </div>

                    <p className="font-medium">
                      No payments found
                    </p>

                  </div>

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}