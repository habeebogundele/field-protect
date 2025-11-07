import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

interface UserStats {
  myFieldsCount: number;
  adjacentFieldsCount: number;
  currentCropsCount: number;
  recentUpdatesCount: number;
}

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery<UserStats>({
    queryKey: ["/api/stats"],
  });

  const statsData = [
    {
      title: "My Fields",
      value: stats?.myFieldsCount || 0,
      icon: "fas fa-map",
      color: "primary",
      subtitle: (stats?.myFieldsCount ?? 0) > 0 ? "+2 from last season" : "Add your first field",
      testId: "card-stat-my-fields",
    },
    {
      title: "Adjacent Fields",
      value: stats?.adjacentFieldsCount || 0,
      icon: "fas fa-users",
      color: "secondary",
      subtitle: (stats?.adjacentFieldsCount ?? 0) > 0 ? `From ${Math.ceil((stats?.adjacentFieldsCount ?? 0) / 2)} neighbors` : "No adjacent fields yet",
      testId: "card-stat-adjacent-fields",
    },
    {
      title: "2025 Crops",
      value: stats?.currentCropsCount || 0,
      icon: "fas fa-seedling",
      color: "chart-1",
      subtitle: "Active plantings",
      testId: "card-stat-current-crops",
    },
    {
      title: "Recent Updates",
      value: stats?.recentUpdatesCount || 0,
      icon: "fas fa-clock",
      color: "chart-2",
      subtitle: "Last 7 days",
      testId: "card-stat-recent-updates",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat) => (
        <Card key={stat.testId} className="bg-card rounded-lg border border-border" data-testid={stat.testId}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground" data-testid={`text-${stat.testId}-title`}>
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-foreground" data-testid={`text-${stat.testId}-value`}>
                  {isLoading ? (
                    <div className="animate-pulse bg-muted h-8 w-12 rounded"></div>
                  ) : (
                    stat.value
                  )}
                </p>
              </div>
              <div className={`h-12 w-12 bg-${stat.color}/10 rounded-lg flex items-center justify-center`}>
                <i className={`${stat.icon} text-${stat.color} text-xl`} aria-hidden="true"></i>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2" data-testid={`text-${stat.testId}-subtitle`}>
              {stat.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
