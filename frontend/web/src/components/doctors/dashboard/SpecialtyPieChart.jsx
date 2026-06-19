import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

import { specialtyData } from "../../../constants/doctors/DasboardData";

const colors = ["#16a34a", "#3b82f6", "#f97316", "#8b5cf6"];

export default function SpecialtyPieChart() {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border h-[260px] sm:h-[300px] lg:h-[340px]">
      <h2 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
        Specialties
      </h2>

      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={specialtyData}
            dataKey="value"
            outerRadius="70%"
            label={false}
          >
            {specialtyData.map((_, i) => (
              <Cell key={i} fill={colors[i]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}