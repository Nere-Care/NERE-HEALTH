import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { MapPin } from "lucide-react";

const data = [
  { region: "Littoral", cases: 1200 },
  { region: "Centre", cases: 900 },
  { region: "Nord", cases: 600 },
  { region: "Ouest", cases: 400 },
];

export default function RegionHeatmap({ darkMode }) {
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
        <MapPin className="w-5 h-5 text-green-500" />
        <h3 className="font-semibold">Regional Spread</h3>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <XAxis dataKey="region" stroke={darkMode ? "#aaa" : "#333"} />
          <YAxis stroke={darkMode ? "#aaa" : "#333"} />
          <Tooltip />
          <Bar dataKey="cases" fill="#22c55e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}