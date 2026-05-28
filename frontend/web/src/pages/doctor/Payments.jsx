import { useState } from "react";

import PaymentSetupModal from "../../components/doctors/Payment/PaymentSetupModal";
import StatsCards from "../../components/doctors/Payment/StatsCards";
import PatientsPaymentsTable from "../../components/doctors/Payment/PatientsPaymentTable";
import DoctorPaymentsHistory from "../../components/doctors/Payment/DoctorsPaymentsHistory";
import WithdrawModal from "../../components/doctors/Payment/WithdrawModal";

import {
  doctorPayments,
  patientPayments,
  paymentStats,
} from "../../constants/doctors/PaymentsData";

export default function Payments({ darkMode }) {

  const [showSetup, setShowSetup] = useState(true);

  const [showWithdraw, setShowWithdraw] =
    useState(false);

  const [showHistory, setShowHistory] =
    useState(false);

  const [selected, setSelected] =
    useState(null);

  const handleDownload = (url) => {

    if (url) {
      window.open(url, "_blank");
    } else {
      alert("No receipt");
    }
  };

  const closeDetails = () =>
    setSelected(null);

  return (
    <div
      className={`min-h-screen transition-colors
      ${
        darkMode
          ? "bg-gray-900 text-white"
          : "bg-gray-50 text-black"
      }`}
    >

      {/* ================= MODALS ================= */}

      <PaymentSetupModal
        isOpen={showSetup}
        setOpen={setShowSetup}
        darkMode={darkMode}
      />

      <WithdrawModal
        isOpen={showWithdraw}
        setOpen={setShowWithdraw}
        darkMode={darkMode}
      />

      {/* ================= PAYMENT DETAILS ================= */}

      {selected && (

        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeDetails}
        >

          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            className={`
              relative
              w-full
              sm:max-w-lg
              rounded-t-[30px]
              sm:rounded-3xl
              p-4
              sm:p-6
              max-h-[90vh]
              overflow-y-auto
              animate-in slide-in-from-bottom duration-300
              ${
                darkMode
                  ? "bg-gray-900 text-white"
                  : "bg-white text-black"
              }
            `}
          >

            {/* CLOSE BUTTON */}

            <button
              onClick={closeDetails}
              className={`
                absolute top-4 right-4
                p-2 rounded-full transition
                ${
                  darkMode
                    ? "hover:bg-gray-800"
                    : "hover:bg-gray-100"
                }
              `}
            >
              <span className="text-xl">
                ✕
              </span>
            </button>

            {/* HEADER */}

            <h3 className="text-xl font-semibold mb-6 pr-10">
              Payment Details
            </h3>

            {/* DETAILS */}

            <div className="space-y-4 text-sm sm:text-base">

              {[
                [
                  "Matricule",
                  selected.matricule ||
                    `PAT-${String(
                      selected.id
                    ).padStart(4, "0")}`,
                ],

                [
                  "Patient",
                  selected.patient,
                ],

                [
                  "Service",
                  selected.service,
                ],

                [
                  "Date",
                  selected.date,
                ],

                [
                  "Amount",
                  selected.amount,
                ],

                [
                  "Method",
                  selected.method,
                ],
              ].map(([key, value], i) => (

                <div
                  key={i}
                  className="flex items-start justify-between gap-4"
                >

                  <span
                    className={`
                      flex-shrink-0
                      ${
                        darkMode
                          ? "text-gray-400"
                          : "text-gray-500"
                      }
                    `}
                  >
                    {key}
                  </span>

                  <span className="font-medium text-right break-words">
                    {value}
                  </span>

                </div>

              ))}

              {/* STATUS */}

              <div className="flex items-center justify-between gap-4">

                <span
                  className={
                    darkMode
                      ? "text-gray-400"
                      : "text-gray-500"
                  }
                >
                  Status
                </span>

                <span
                  className={`
                    px-3 py-1 rounded-full
                    text-xs font-medium
                    ${
                      selected.status ===
                      "Paid"
                        ? "bg-green-500 text-white"
                        : selected.status ===
                          "Pending"
                        ? "bg-yellow-500 text-white"
                        : "bg-red-500 text-white"
                    }
                  `}
                >
                  {selected.status}
                </span>

              </div>

            </div>

            {/* ACTIONS */}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">

              <button
                onClick={() =>
                  handleDownload(
                    selected.receipt
                  )
                }
                className="
                  flex-1
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  py-3
                  rounded-xl
                  font-medium
                  transition
                  min-h-[48px]
                "
              >
                📄 Download Receipt
              </button>

              <button
                onClick={closeDetails}
                className={`
                  flex-1
                  py-3
                  rounded-xl
                  font-medium
                  transition
                  min-h-[48px]
                  ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-200 hover:bg-gray-300"
                  }
                `}
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ================= MAIN CONTENT ================= */}

      <div className="p-3 sm:p-5 lg:p-6">

        <div
          className={`
            rounded-2xl
            border
            p-4
            sm:p-6
            space-y-6
            transition
            ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }
          `}
        >

          {/* ================= HEADER ================= */}

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            {/* LEFT */}

            <div>

              <h1 className="text-xl sm:text-2xl font-bold text-blue-600">
                Doctor Payments
              </h1>

              <p
                className={`
                  text-sm mt-1
                  ${
                    darkMode
                      ? "text-gray-400"
                      : "text-gray-500"
                  }
                `}
              >
                Manage settlements & withdrawals
              </p>

            </div>

            {/* RIGHT BUTTONS */}

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">

              <button
                onClick={() =>
                  setShowHistory(
                    !showHistory
                  )
                }
                className={`
                  flex-1 sm:flex-none
                  px-5 py-3
                  rounded-2xl
                  text-sm font-medium
                  text-white
                  transition
                  min-h-[48px]
                  ${
                    showHistory
                      ? "bg-gray-600 hover:bg-gray-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }
                `}
              >
                {showHistory
                  ? "Show Patients"
                  : "View History"}
              </button>

              <button
                onClick={() =>
                  setShowWithdraw(true)
                }
                className="
                  flex-1 sm:flex-none
                  px-5 py-3
                  rounded-2xl
                  text-sm font-medium
                  bg-green-600
                  hover:bg-green-700
                  text-white
                  transition
                  min-h-[48px]
                "
              >
                Withdraw
              </button>

            </div>

          </div>

          {/* ================= STATS ================= */}

          <StatsCards
            stats={paymentStats}
            darkMode={darkMode}
          />

          {/* ================= CONTENT ================= */}

          <div className="w-full overflow-hidden">

            {showHistory ? (

              <DoctorPaymentsHistory
                payments={doctorPayments}
                darkMode={darkMode}
              />

            ) : (

              <PatientsPaymentsTable
                payments={patientPayments}
                darkMode={darkMode}
                onViewDetails={setSelected}
                onDownloadReceipt={
                  handleDownload
                }
              />

            )}

          </div>

        </div>

      </div>

    </div>
  );
}