import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { revenueData } from "../../../constants/doctors/DasboardData";

export default function RevenueChart({ darkMode }) {
  return (
    <div className={`rounded-2xl p-4 sm:p-5 shadow-sm border transition-colors
      h-[260px] sm:h-[300px] lg:h-[340px]
      ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border text-black"}
    `}>
      <h2 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
        Weekly Revenue
      </h2>

      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={revenueData}>
          <XAxis dataKey="day" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#16a34a"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}