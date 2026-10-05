"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { categoryLabels } from "@/lib/validations/achievement";
import { formatDate } from "@/lib/utils";
import { Trophy, Star, Calendar, Plus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

const categoryColors: Record<string, "primary" | "secondary" | "success" | "warning" | "error" | "info" | "default"> = {
  academic: "primary",
  competition: "warning",
  certificate: "success",
  extracurricular: "secondary",
  community_service: "info",
  sports: "error",
  creative: "secondary",
  leadership: "warning",
  other: "default",
};

interface TimelineAchievement {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  date: string;
  issuingOrg?: string | null;
  isHighlight?: boolean;
}

export default function TimelinePage() {
  const [selectedYear, setSelectedYear] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["timeline", selectedYear],
    queryFn: () => {
      const params = selectedYear ? `?year=${selectedYear}` : "";
      return fetch(`/api/timeline${params}`).then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); });
    },
  });

  const years: number[] = data?.years || [];
  const grouped: Record<string, TimelineAchievement[]> = data?.grouped || {};
  const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      <PageHeader
        title="Timeline"
        description="Your journey at a glance."
        action={
          <Link href="/achievements">
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" /> Add Achievement
            </Button>
          </Link>
        }
      />

      {years.length > 0 && (
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <button
            onClick={() => setSelectedYear("")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !selectedYear
                ? "bg-primary-500 text-white"
                : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
            }`}
          >
            All
          </button>
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(String(year))}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedYear === String(year)
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : months.length > 0 ? (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-dark-border" />

          <div className="space-y-10">
            {months.map((monthKey) => {
              const [year, month] = monthKey.split("-");
              const monthDate = new Date(Number(year), Number(month) - 1);
              const monthLabel = format(monthDate, "MMMM yyyy");

              return (
                <div key={monthKey}>
                  <div className="flex items-center gap-3 mb-4 relative">
                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center z-10">
                      <Calendar className="h-5 w-5 text-primary-500" />
                    </div>
                    <h2 className="text-lg font-semibold">{monthLabel}</h2>
                    <Badge variant="default">{grouped[monthKey].length}</Badge>
                  </div>

                  <div className="ml-[3.25rem] space-y-3">
                    {grouped[monthKey].map((achievement) => (
                      <Link key={achievement.id} href={`/achievements/${achievement.id}`}>
                        <Card hover className="!p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 shrink-0">
                              <Trophy className="h-4 w-4 text-primary-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-sm truncate">{achievement.title}</h3>
                                {achievement.isHighlight && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                              </div>
                              {achievement.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                                  {achievement.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1.5">
                                <Badge variant={categoryColors[achievement.category] || "default"}>
                                  {categoryLabels[achievement.category] || achievement.category}
                                </Badge>
                                <span className="text-xs text-gray-400">{formatDate(achievement.date)}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="No timeline entries yet"
          description="Add achievements to see them on your timeline."
          action={
            <Link href="/achievements">
              <Button size="sm">
                <Plus className="h-4 w-4" /> Add Achievement
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
