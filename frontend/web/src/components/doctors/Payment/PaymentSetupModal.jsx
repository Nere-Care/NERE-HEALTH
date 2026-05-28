import { useState } from "react";
import { X } from "lucide-react";

export default function PaymentSetupModal({
  isOpen,
  setOpen,
  darkMode,
}) {
  const [method, setMethod] =
    useState("momo");

  if (!isOpen) return null;

  const inputStyle = `
    w-full rounded-2xl border p-3 outline-none
    ${
      darkMode
        ? "bg-gray-800 border-gray-700 text-white"
        : "bg-white border-gray-300 text-black"
    }
  `;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">

      <div
        className={`w-full max-w-lg rounded-3xl p-6 space-y-5
        ${
          darkMode
            ? "bg-gray-900 text-white"
            : "bg-white text-black"
        }`}
      >
        <div className="flex items-center justify-between">

          <h2 className="text-xl font-semibold">
            Configure Payment Method
          </h2>

          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-xl hover:bg-gray-200/20 transition"
          >
            <X size={20} />
          </button>

        </div>

        <select
          value={method}
          onChange={(e) =>
            setMethod(e.target.value)
          }
          className={inputStyle}
        >
          <option value="momo">
            MTN Mobile Money
          </option>

          <option value="orange">
            Orange Money
          </option>

          <option value="bank">
            Bank Account
          </option>
        </select>

        <div className="space-y-3">

          <input
            placeholder="Account Name"
            className={inputStyle}
          />

          <input
            placeholder={
              method === "bank"
                ? "Account Number"
                : "Phone Number"
            }
            className={inputStyle}
          />

          {method === "bank" && (
            <input
              placeholder="IBAN"
              className={inputStyle}
            />
          )}

        </div>

        <button
          onClick={() => setOpen(false)}
          className="w-full rounded-2xl bg-green-600 hover:bg-green-700 py-3 text-white font-medium transition"
        >
          Save Configuration
        </button>

      </div>
    </div>
  );
}