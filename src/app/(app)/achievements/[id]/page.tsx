"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/ui/toast";
import { categoryLabels } from "@/lib/validations/achievement";
import { formatDate, parseJsonArray } from "@/lib/utils";
import { Trophy, Calendar, Building2, Star, Pencil, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

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

export default function AchievementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: achievement, isLoading } = useQuery({
    queryKey: ["achievement", id],
    queryFn: () => fetch(`/api/achievements/${id}`).then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); }),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/achievements/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Achievement deleted");
      router.push("/achievements");
    },
    onError: () => toast("Failed to delete achievement", "error"),
  });

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!achievement || achievement.error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Achievement not found.</p>
        <Link href="/achievements">
          <Button variant="outline" size="sm" className="mt-4">
            <ArrowLeft className="h-4 w-4" /> Back to Achievements
          </Button>
        </Link>
      </div>
    );
  }

  const tags = parseJsonArray(achievement.tags);

  return (
    <div>
      <div className="mb-6">
        <Link href="/achievements" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Achievements
        </Link>
      </div>

      <Card className="max-w-3xl">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <Trophy className="h-8 w-8 text-primary-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{achievement.title}</h1>
                {achievement.isHighlight && <Star className="h-5 w-5 text-amber-400 fill-amber-400" />}
              </div>
              <Badge variant={categoryColors[achievement.category] || "default"} className="mt-2">
                {categoryLabels[achievement.category] || achievement.category}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/achievements/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              onClick={() => deleteMutation.mutate()}
              loading={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        {achievement.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-6 whitespace-pre-wrap">
            {achievement.description}
          </p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatDate(achievement.date)}
          </span>
          {achievement.issuingOrg && (
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {achievement.issuingOrg}
            </span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="default">{tag}</Badge>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
