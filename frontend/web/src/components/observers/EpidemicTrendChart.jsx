import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { TrendingUp } from "lucide-react";

const data = [
  { month: "Jan", cases: 400 },
  { month: "Feb", cases: 800 },
  { month: "Mar", cases: 600 },
  { month: "Apr", cases: 1200 },
];

export default function EpidemicTrendChart({ darkMode }) {
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
        <TrendingUp className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold">Epidemic Evolution</h3>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <XAxis dataKey="month" stroke={darkMode ? "#aaa" : "#333"} />
          <YAxis stroke={darkMode ? "#aaa" : "#333"} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="cases"
            stroke="#3b82f6"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}