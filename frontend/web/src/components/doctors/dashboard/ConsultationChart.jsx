import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { consultationsData } from "../../../constants/doctors/DasboardData";

export default function ConsultationChart({ darkMode }) {
  return (
    <div className={`rounded-2xl p-4 sm:p-5 shadow-sm border transition-colors
      h-[260px] sm:h-[300px] lg:h-[340px]
      ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border text-black"}
    `}>
      <h2 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
        Monthly Consultations
      </h2>

      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={consultationsData}>
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}