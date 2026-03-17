type StatsCardProps = {
  icon: string;
  label: string;
  value: number | string;
  color?: "purple" | "amber" | "green" | "blue";
};

export function StatsCard({ icon, label, value, color = "purple" }: StatsCardProps) {
  const colorClasses = {
    purple: "from-purple-600/10 to-purple-600/5 dark:from-[#8b5cf6]/20 dark:to-[#8b5cf6]/5 border-purple-200/30 dark:border-[#8b5cf6]/20",
    amber: "from-amber-500/10 to-amber-500/5 dark:from-[#fbbf24]/20 dark:to-[#fbbf24]/5 border-amber-200/30 dark:border-[#fbbf24]/20",
    green: "from-green-500/10 to-green-500/5 dark:from-green-500/20 dark:to-green-500/5 border-green-200/30 dark:border-green-500/20",
    blue: "from-blue-500/10 to-blue-500/5 dark:from-blue-500/20 dark:to-blue-500/5 border-blue-200/30 dark:border-blue-500/20",
  };

  return (
    <div className={`glass-card rounded-2xl p-5 border bg-gradient-to-br ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-[#f0e6ff]">{value}</p>
          <p className="text-sm text-gray-500 dark:text-[#a78bfa]/60">{label}</p>
        </div>
      </div>
    </div>
  );
}
