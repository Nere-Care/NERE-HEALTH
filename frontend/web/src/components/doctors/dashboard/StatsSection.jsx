import { Users, Calendar, Stethoscope, TrendingUp } from "lucide-react";
import StatCard from "./StatCard";

const ICON_MAP = {
  "Total Patients":       { icon: Users,        color: "green"  },
  "Appointments Today":   { icon: Calendar,     color: "blue"   },
  "Consultations":        { icon: Stethoscope,  color: "purple" },
  "Revenue":              { icon: TrendingUp,   color: "orange" },
};

export default function StatsSection({ darkMode, stats = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((item, i) => {
        const config = ICON_MAP[item.title] || { icon: Users, color: "blue" };
        return (
          <StatCard
            key={i}
            item={{ ...item, icon: config.icon, color: config.color }}
            darkMode={darkMode}
          />
        );
      })}
    </div>
  );
}