import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Malaria", value: 400 },
  { name: "Typhoid", value: 300 },
  { name: "Cholera", value: 200 },
  { name: "Flu", value: 100 },
];

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

export default function DiseaseDistribution({ darkMode }) {
  return (
    <div className={`p-4 rounded-xl border
      ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}
    `}>

      <h3 className="font-semibold mb-3">Disease Distribution</h3>

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