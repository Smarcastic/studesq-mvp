"use client";

import { useMemo } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeUp, StaggerList, StaggerItem } from "@/components/ui/motion";
import { Lightbulb, ArrowRight } from "lucide-react";
import {
  detectWeaknesses,
  type StudentAnalyticsData,
  type WeaknessInsight,
} from "@/lib/ai-engine";

interface SmartInsightsProps {
  data: StudentAnalyticsData;
}

const SEVERITY_BADGE: Record<
  WeaknessInsight["severity"],
  "error" | "warning" | "teal"
> = {
  critical: "error",
  warning: "warning",
  info: "teal",
};

export function SmartInsights({ data }: SmartInsightsProps) {
  const insights = useMemo(() => {
    if (!data.studySessions || data.studySessions.length < 5) return [];
    return detectWeaknesses(data).slice(0, 3);
  }, [data]);

  if (insights.length === 0) {
    return (
      <FadeUp delay={0.35}>
        <Card>
          <CardTitle className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Smart Insights
          </CardTitle>
          <div className="flex flex-col items-center py-6 gap-2 text-center">
            <Lightbulb className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Complete 5+ study sessions to unlock personalized insights
            </p>
          </div>
        </Card>
      </FadeUp>
    );
  }

  return (
    <FadeUp delay={0.35}>
      <Card>
        <CardTitle className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Smart Insights
        </CardTitle>
        <StaggerList className="space-y-2.5">
          {insights.map((insight, i) => (
            <StaggerItem key={i}>
              <div className="p-3 rounded-xl space-y-1.5" style={{ background: 'var(--bg-elevated)' }}>
                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0">{insight.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {insight.title}
                      </p>
                      <Badge variant={SEVERITY_BADGE[insight.severity]}>
                        {insight.severity}
                      </Badge>
                    </div>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                      {insight.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-cyan-600 font-medium pl-6">
                  <ArrowRight className="h-3 w-3" />
                  {insight.actionable}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerList>
      </Card>
    </FadeUp>
  );
}
