import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Activity } from "lucide-react";

const data = [
  { name: "Malaria", value: 400 },
  { name: "Typhoid", value: 300 },
  { name: "Cholera", value: 200 },
  { name: "Flu", value: 100 },
];

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

export default function DiseaseDistribution({ darkMode }) {
  return (
    <div
      className={`p-4 rounded-xl border transition
      ${
        darkMode
          ? "bg-gray-900 border-gray-800"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold">Disease Breakdown</h3>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="value" outerRadius={90}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}