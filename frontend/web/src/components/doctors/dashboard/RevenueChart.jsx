import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { revenueData } from "../../../constants/doctors/DasboardData";

export default function RevenueChart({ darkMode }) {
  const totalRevenue = revenueData.reduce((acc, d) => acc + d.amount, 0);

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition
      h-[260px] sm:h-[300px] lg:h-[340px]
      ${
        darkMode
          ? "bg-gray-800 border-gray-700 text-white"
          : "bg-white border-gray-200 text-black"
      }`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm sm:text-base">
          Weekly Revenue
        </h2>

        <span className="text-xs font-medium text-green-500">
          {totalRevenue.toLocaleString()} FCFA
        </span>
      </div>

      {/* CHART */}
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={revenueData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? "#374151" : "#e5e7eb"}
          />

          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: darkMode ? "#9ca3af" : "#374151" }}
          />

          <YAxis
            tick={{ fontSize: 11, fill: darkMode ? "#9ca3af" : "#374151" }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: darkMode ? "#1f2937" : "#fff",
              border: "none",
              borderRadius: "10px",
              color: darkMode ? "#fff" : "#000",
            }}
          />

          <Line
            type="monotone"
            dataKey="amount"
            stroke="#16a34a"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}