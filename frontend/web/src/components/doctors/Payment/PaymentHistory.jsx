import { useState } from "react";
import { CheckCircle, Clock, XCircle, Search } from "lucide-react";

export default function PaymentHistory({ payments, darkMode }) {
  const [search, setSearch] = useState("");

  const statusConfig = {
    paid: {
      icon: CheckCircle,
      style: "text-green-700 bg-green-50 border-green-200",
      label: "Paid",
    },
    pending: {
      icon: Clock,
      style: "text-yellow-700 bg-yellow-50 border-yellow-200",
      label: "Pending",
    },
    failed: {
      icon: XCircle,
      style: "text-red-700 bg-red-50 border-red-200",
      label: "Failed",
    },
  };

  const filtered = payments.filter((p) => {
    const v = search.toLowerCase();
    return (
      p.service.toLowerCase().includes(v) ||
      p.method.toLowerCase().includes(v) ||
      p.date.toLowerCase().includes(v)
    );
  });

  return (
    <div className="space-y-4">

      <h2
        className={`font-semibold ${
          darkMode ? "text-white" : "text-[#2C3850]"
        }`}
      >
        Payment History
      </h2>

      {/* SEARCH */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search payments..."
          className={`w-full pl-9 p-2 border rounded-xl text-sm ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-white"
              : "bg-white border-gray-300 text-black"
          }`}
        />
      </div>

      {/* SCROLL */}
      <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1">

        {filtered.map((p) => {
          const config = statusConfig[p.status];
          const Icon = config.icon;

          return (
            <div
              key={p.id}
              className={`border rounded-xl p-4 transition ${
                darkMode
                  ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                  : "bg-white border-gray-200 hover:shadow-sm"
              }`}
            >

              <div className="flex justify-between gap-3">

                <div>
                  <p className="font-medium text-sm">{p.service}</p>

                  <p
                    className={`text-xs ${
                      darkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    {p.method} • {p.date}
                  </p>
                </div>

                <p className="font-semibold text-sm whitespace-nowrap">
                  {p.amount} XAF
                </p>

              </div>

              <div
                className={`mt-2 inline-flex px-2 py-1 rounded-lg border items-center gap-1 text-xs ${config.style}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {config.label}
              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}