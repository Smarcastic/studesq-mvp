"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { AchievementForm } from "@/components/achievements/achievement-form";
import { useToast } from "@/components/ui/toast";
import { parseJsonArray } from "@/lib/utils";
import { type AchievementInput } from "@/lib/validations/achievement";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditAchievementPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: achievement, isLoading } = useQuery({
    queryKey: ["achievement", id],
    queryFn: () => fetch(`/api/achievements/${id}`).then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); }),
  });

  const mutation = useMutation({
    mutationFn: (data: AchievementInput) =>
      fetch(`/api/achievements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      queryClient.invalidateQueries({ queryKey: ["achievement", id] });
      toast("Achievement updated successfully!");
      router.push(`/achievements/${id}`);
    },
    onError: () => toast("Failed to update achievement", "error"),
  });

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    );
  }

  if (!achievement || achievement.error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Achievement not found.</p>
        <Link href="/achievements" className="text-primary-500 hover:underline mt-2 block">
          Back to Achievements
        </Link>
      </div>
    );
  }

  const defaultValues: Partial<AchievementInput> = {
    title: achievement.title,
    description: achievement.description || "",
    category: achievement.category,
    date: achievement.date ? new Date(achievement.date).toISOString().split("T")[0] : "",
    issuingOrg: achievement.issuingOrg || "",
    tags: parseJsonArray(achievement.tags),
    isHighlight: achievement.isHighlight || false,
  };

  return (
    <div>
      <div className="mb-6">
        <Link href={`/achievements/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Achievement
        </Link>
      </div>

      <PageHeader title="Edit Achievement" description="Update your achievement details." />

      <Card className="max-w-2xl">
        <AchievementForm
          defaultValues={defaultValues}
          onSubmit={(data) => mutation.mutate(data)}
          onCancel={() => router.back()}
          saving={mutation.isPending}
        />
      </Card>
    </div>
  );
}
