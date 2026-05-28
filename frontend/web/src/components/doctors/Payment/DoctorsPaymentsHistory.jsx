import { Download } from "lucide-react";

const exportToCSV = (
  data,
  filename = "doctor_payments"
) => {
  if (!data?.length) {
    alert("No data");
    return;
  }

  const headers = [
    "Matricule",
    "Recipient",
    "Service",
    "Date",
    "Amount",
    "Method",
    "Status",
  ];

  const rows = data.map((p) => [
    p.matricule,
    p.recipient,
    p.service,
    p.date,
    p.amount,
    p.method,
    p.status,
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) =>
          `"${String(cell).replace(/"/g, '""')}"`
        )
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = `${
    filename
  }_${new Date().toISOString().split("T")[0]}.csv`;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

const downloadPDF = async (
  url,
  filename = "receipt.pdf"
) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error();
    }

    const blob = await response.blob();

    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = blobUrl;
    link.download = filename;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(blobUrl);

    return true;
  } catch {
    window.open(url, "_blank");
    return false;
  }
};

export default function DoctorPaymentsHistory({
  payments,
  darkMode,
  onExport,
  onDownloadReceipt,
}) {

  const getStatusBadge = (status) => {

    const styles = {
      Completed:
        "bg-green-500 text-white dark:bg-green-900/40 dark:text-green-300",

      Pending:
        "bg-yellow-500 text-white dark:bg-yellow-900/40 dark:text-yellow-300",

      Failed:
        "bg-red-500 text-white dark:bg-red-900/40 dark:text-red-300",
    };

    return (
      styles[status] ||
      "bg-gray-400 text-white dark:bg-gray-600 dark:text-gray-200"
    );
  };

  const handleExport = () => {

    if (onExport) {
      onExport();
    }

    exportToCSV(
      payments,
      "doctor_payments"
    );
  };

  const handleReceipt = async (
    url,
    e
  ) => {

    e?.stopPropagation();

    if (!url) {
      alert("No receipt");
      return;
    }

    if (onDownloadReceipt) {
      onDownloadReceipt(url);
      return;
    }

    const filename =
      url.split("/").pop() ||
      `receipt_${Date.now()}.pdf`;

    const success = await downloadPDF(
      url,
      filename
    );

    if (!success) {
      alert(
        "Receipt opened in new tab"
      );
    }
  };

  return (

    <div
      className={`rounded-2xl border overflow-hidden
      ${
        darkMode
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
      }`}
    >

      {/* HEADER */}

      <div
        className={`p-4 sm:p-5 border-b
        ${
          darkMode
            ? "border-gray-700"
            : "border-gray-200"
        }`}
      >

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div className="min-w-0">

            <h2 className="text-lg sm:text-xl font-semibold truncate">
              Doctor Payments History
            </h2>

            <p
              className={`text-xs sm:text-sm mt-1
              ${
                darkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              }`}
            >
              Settlements & transactions
            </p>

          </div>

          <button
            onClick={handleExport}
            className="
              bg-blue-600 hover:bg-blue-700
              text-white
              px-4 py-3
              rounded-xl
              text-sm font-medium
              flex items-center justify-center gap-2
              min-h-[44px]
              w-full sm:w-auto
              transition
            "
          >

            <Download className="w-4 h-4 flex-shrink-0" />

            <span>
              Export CSV
            </span>

          </button>

        </div>

      </div>

      {/* MOBILE CARDS */}

      <div className="block lg:hidden p-4 space-y-4">

        {payments?.length ? (

          payments.map((p) => (

            <div
              key={p.matricule}
              className={`rounded-2xl border p-4 space-y-4
              ${
                darkMode
                  ? "bg-gray-900 border-gray-700"
                  : "bg-gray-50 border-gray-200"
              }`}
            >

              {/* TOP */}

              <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">

                  <code
                    className={`text-[10px] sm:text-xs px-2 py-1 rounded font-mono
                    ${
                      darkMode
                        ? "bg-gray-700 text-blue-300"
                        : "bg-gray-200 text-blue-700"
                    }`}
                  >
                    {p.matricule}
                  </code>

                  <h3 className="font-semibold text-sm sm:text-base mt-3 truncate">
                    {p.recipient}
                  </h3>

                  <p
                    className={`text-xs mt-1
                    ${
                      darkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    via {p.method}
                  </p>

                </div>

                <span
                  className={`inline-flex px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap
                  ${getStatusBadge(
                    p.status
                  )}`}
                >
                  {p.status}
                </span>

              </div>

              {/* INFOS */}

              <div className="grid grid-cols-2 gap-3 text-sm">

                <div>

                  <p
                    className={`text-xs mb-1
                    ${
                      darkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    Service
                  </p>

                  <p className="font-medium truncate">
                    {p.service}
                  </p>

                </div>

                <div>

                  <p
                    className={`text-xs mb-1
                    ${
                      darkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    Amount
                  </p>

                  <p className="font-semibold">
                    {p.amount}
                  </p>

                </div>

                <div>

                  <p
                    className={`text-xs mb-1
                    ${
                      darkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    Date
                  </p>

                  <p>
                    {p.date}
                  </p>

                </div>

                <div>

                  <p
                    className={`text-xs mb-1
                    ${
                      darkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    Method
                  </p>

                  <p className="truncate">
                    {p.method}
                  </p>

                </div>

              </div>

              {/* ACTION */}

              <button
                onClick={(e) =>
                  handleReceipt(
                    p.receipt,
                    e
                  )
                }
                className="
                  w-full
                  bg-blue-600 hover:bg-blue-700
                  text-white
                  py-3
                  rounded-xl
                  text-sm font-medium
                  flex items-center justify-center gap-2
                  min-h-[44px]
                  transition
                "
              >

                <Download className="w-4 h-4" />

                <span>
                  Download Receipt
                </span>

              </button>

            </div>

          ))

        ) : (

          <div
            className={`text-center py-12 rounded-2xl border
            ${
              darkMode
                ? "border-gray-700 text-gray-400"
                : "border-gray-200 text-gray-500"
            }`}
          >

            No history available

          </div>

        )}

      </div>

      {/* DESKTOP TABLE */}

      <div className="hidden lg:block overflow-x-auto">

        <table className="w-full min-w-[760px]">

          <thead>

            <tr
              className={`text-left text-xs uppercase border-b
              ${
                darkMode
                  ? "text-gray-400 border-gray-700"
                  : "text-gray-500 border-gray-200"
              }`}
            >

              <th className="py-4 px-5 font-medium whitespace-nowrap">
                Matricule
              </th>

              <th className="py-4 px-5 font-medium whitespace-nowrap">
                Recipient
              </th>

              <th className="py-4 px-5 font-medium whitespace-nowrap">
                Service
              </th>

              <th className="py-4 px-5 font-medium whitespace-nowrap">
                Date
              </th>

              <th className="py-4 px-5 font-medium whitespace-nowrap">
                Amount
              </th>

              <th className="py-4 px-5 font-medium whitespace-nowrap">
                Status
              </th>

              <th className="py-4 px-5 font-medium whitespace-nowrap text-right">
                Action
              </th>

            </tr>

          </thead>

          <tbody
            className={`divide-y
            ${
              darkMode
                ? "divide-gray-700"
                : "divide-gray-200"
            }`}
          >

            {payments?.length ? (

              payments.map((p) => (

                <tr
                  key={p.matricule}
                  className={`transition
                  ${
                    darkMode
                      ? "hover:bg-gray-700/40"
                      : "hover:bg-gray-50"
                  }`}
                >

                  {/* MATRICULE */}

                  <td className="py-4 px-5">

                    <code
                      className={`text-xs px-2 py-1 rounded font-mono
                      ${
                        darkMode
                          ? "bg-gray-700 text-blue-300"
                          : "bg-gray-100 text-blue-700"
                      }`}
                    >
                      {p.matricule}
                    </code>

                  </td>

                  {/* RECIPIENT */}

                  <td className="py-4 px-5">

                    <p className="font-semibold">
                      {p.recipient}
                    </p>

                    <p
                      className={`text-xs mt-1
                      ${
                        darkMode
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      via {p.method}
                    </p>

                  </td>

                  {/* SERVICE */}

                  <td className="py-4 px-5">

                    <p className="truncate max-w-[160px]">
                      {p.service}
                    </p>

                  </td>

                  {/* DATE */}

                  <td className="py-4 px-5">

                    <p
                      className={`text-sm whitespace-nowrap
                      ${
                        darkMode
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      {p.date}
                    </p>

                  </td>

                  {/* AMOUNT */}

                  <td className="py-4 px-5">

                    <p className="font-semibold whitespace-nowrap">
                      {p.amount}
                    </p>

                  </td>

                  {/* STATUS */}

                  <td className="py-4 px-5">

                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap
                      ${getStatusBadge(
                        p.status
                      )}`}
                    >
                      {p.status}
                    </span>

                  </td>

                  {/* ACTION */}

                  <td className="py-4 px-5 text-right">

                    <button
                      onClick={(e) =>
                        handleReceipt(
                          p.receipt,
                          e
                        )
                      }
                      className="
                        bg-blue-600 hover:bg-blue-700
                        text-white
                        px-4 py-2.5
                        rounded-xl
                        text-xs font-medium
                        inline-flex items-center gap-2
                        transition
                      "
                    >

                      <Download className="w-3.5 h-3.5" />

                      <span>
                        Receipt
                      </span>

                    </button>

                  </td>

                </tr>

              ))

            ) : (

              <tr>

                <td
                  colSpan={7}
                  className={`text-center py-12
                  ${
                    darkMode
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}
                >

                  No history available

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}