import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { consultationsData } from "../../../constants/doctors/DasboardData";

export default function ConsultationChart({ darkMode }) {
  const totalConsultations = consultationsData.reduce(
    (acc, d) => acc + d.total,
    0
  );

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
          Monthly Consultations
        </h2>

        <span className="text-xs font-medium text-blue-500">
          {totalConsultations} total
        </span>
      </div>

      {/* CHART */}
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={consultationsData}>
          
          {/* GRID */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? "#374151" : "#e5e7eb"}
          />

          {/* AXES */}
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: darkMode ? "#9ca3af" : "#374151" }}
          />

          <YAxis
            tick={{ fontSize: 11, fill: darkMode ? "#9ca3af" : "#374151" }}
          />

          {/* TOOLTIP */}
          <Tooltip
            contentStyle={{
              backgroundColor: darkMode ? "#1f2937" : "#fff",
              border: "none",
              borderRadius: "10px",
              color: darkMode ? "#fff" : "#000",
            }}
            cursor={{ fill: darkMode ? "#374151" : "#f3f4f6" }}
          />

          {/* BAR */}
          <Bar
            dataKey="total"
            fill="#3b82f6"
            radius={[8, 8, 0, 0]}
            barSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}