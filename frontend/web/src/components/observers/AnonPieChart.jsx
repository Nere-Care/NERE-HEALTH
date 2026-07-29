import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function AnonPieChart({
  data = [],
  darkMode = false,
  height = 250,
  colors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"],
  nameKey = "name",
  valueKey = "value",
  showLegend = true,
  innerRadius = 0, // Mettre >0 pour un graphique en donut
}) {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius="80%"
            innerRadius={innerRadius}
            paddingAngle={2}
            cornerRadius={4}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          
          <Tooltip
            contentStyle={{
              backgroundColor: darkMode ? "#1e293b" : "#ffffff",
              border: "none",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              color: darkMode ? "#f8fafc" : "#0f172a",
              fontSize: 13,
              padding: "10px 14px"
            }}
            formatter={(value, name) => [
              `${Number(value).toLocaleString("fr-FR")}`,
              name
            ]}
          />
          
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => (
                <span className={`${darkMode ? "text-gray-300" : "text-gray-600"} text-xs font-medium`}>
                  {value}
                </span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      
      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block"></span>
        Données agrégées et anonymisées • Aucune donnée nominative
      </p>
    </div>
  );
}