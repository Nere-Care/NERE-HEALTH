import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Users } from "lucide-react";

const data = [
  { age: "0-18", patients: 200 },
  { age: "19-35", patients: 600 },
  { age: "36-60", patients: 900 },
  { age: "60+", patients: 300 },
];

export default function DemographicsChart({ darkMode }) {
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
        <Users className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold">Population Distribution</h3>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="age" stroke={darkMode ? "#aaa" : "#333"} />
          <YAxis stroke={darkMode ? "#aaa" : "#333"} />
          <Tooltip />
          <Bar dataKey="patients" fill="#8b5cf6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}