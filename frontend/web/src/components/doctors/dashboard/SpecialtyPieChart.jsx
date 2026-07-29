import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

const colors = ["#16a34a", "#3b82f6", "#f97316", "#8b5cf6"];

export default function SpecialtyPieChart({ data = [] }) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border h-[260px] sm:h-[300px] lg:h-[340px] flex flex-col min-h-0 min-w-0">
      <h2 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base shrink-0">
        Specialties
      </h2>

      <div className="flex-1 min-h-0 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              outerRadius="70%"
              label={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
