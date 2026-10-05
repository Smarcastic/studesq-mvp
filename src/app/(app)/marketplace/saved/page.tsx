"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { FadeUp, StaggerList, StaggerItem } from "@/components/ui/motion";
import { useToast } from "@/components/ui/toast";
import {
  Heart, Calendar, MapPin, Laptop, Clock, ArrowRight,
  GraduationCap, Trophy, CheckCircle2,
} from "lucide-react";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  INTERESTED: { label: "Interested", color: "bg-blue-50 text-blue-600" },
  APPLIED: { label: "Applied", color: "bg-amber-50 text-amber-700" },
  REGISTERED: { label: "Registered", color: "bg-indigo-50 text-indigo-700" },
  ATTENDED: { label: "Attended", color: "bg-emerald-50 text-emerald-700" },
  WITHDREW: { label: "Withdrew", color: "bg-slate-50 text-slate-500" },
};

interface SavedEvent {
  saveId: string;
  savedAt: string;
  application: { status: string; notes: string | null } | null;
  event: {
    id: string;
    slug: string;
    title: string;
    category: string;
    organizerName: string;
    city: string | null;
    state: string | null;
    isOnline: boolean;
    eventStartDate: string | null;
    registrationDeadline: string | null;
    fee: number | null;
    isVerified: boolean;
    minGrade: number | null;
    maxGrade: number | null;
  };
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Registration closed", urgent: false };
  if (days === 0) return { label: "Closes today!", urgent: true };
  if (days <= 3) return { label: `${days}d left`, urgent: true };
  if (days <= 14) return { label: `${days} days left`, urgent: false };
  return { label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), urgent: false };
}

export default function SavedEventsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: saved = [], isLoading } = useQuery<SavedEvent[]>({
    queryKey: ["marketplace-saved"],
    queryFn: () => fetch("/api/marketplace/saved").then((r) => r.json()),
  });

  const unsaveMutation = useMutation({
    mutationFn: (slug: string) =>
      fetch(`/api/marketplace/${slug}/save`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      toast("Removed from saved");
      queryClient.invalidateQueries({ queryKey: ["marketplace-saved"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ slug, status }: { slug: string; status: string }) =>
      fetch(`/api/marketplace/${slug}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast("Status updated!");
      queryClient.invalidateQueries({ queryKey: ["marketplace-saved"] });
    },
  });

  const STATUS_FLOW = ["INTERESTED", "APPLIED", "REGISTERED", "ATTENDED"];

  return (
    <div>
      <PageHeader
        title="Saved Events"
        action={
          <Link href="/marketplace">
            <Button variant="outline" size="sm">Browse More</Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : saved.length === 0 ? (
        <FadeUp>
          <Card>
            <CardContent className="py-16 flex flex-col items-center gap-3">
              <Heart className="h-10 w-10" style={{ color: "var(--text-muted)" }} />
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>No saved events yet</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Save events from the marketplace to track them here.
              </p>
              <Link href="/marketplace">
                <Button size="sm">Browse Marketplace</Button>
              </Link>
            </CardContent>
          </Card>
        </FadeUp>
      ) : (
        <StaggerList className="space-y-4">
          {saved.map(({ saveId, savedAt, application, event }) => {
            const deadline = formatDeadline(event.registrationDeadline);
            const currentStatus = application?.status ?? "INTERESTED";
            const currentIdx = STATUS_FLOW.indexOf(currentStatus);

            return (
              <StaggerItem key={saveId}>
                <Card>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Event info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link href={`/marketplace/${event.slug}`}>
                              <CardTitle className="text-base hover:text-primary-600 transition-colors">
                                {event.title}
                              </CardTitle>
                            </Link>
                            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                              {event.organizerName}
                            </p>
                          </div>
                          <button
                            onClick={() => unsaveMutation.mutate(event.slug)}
                            className="shrink-0 p-1.5 rounded-lg transition-colors hover:bg-red-50"
                          >
                            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                          <span className="flex items-center gap-1">
                            {event.isOnline ? <Laptop className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                            {event.isOnline ? "Online" : (event.city ?? event.state ?? "India")}
                          </span>
                          {event.registrationDeadline && (
                            <span className={`flex items-center gap-1 font-medium ${deadline?.urgent ? "text-red-600" : ""}`}>
                              <Clock className="h-3.5 w-3.5" />
                              {deadline?.label}
                            </span>
                          )}
                          <span className={event.fee === null ? "text-emerald-600 font-medium" : ""}>
                            {event.fee === null ? "Free" : `₹${event.fee.toLocaleString("en-IN")}`}
                          </span>
                        </div>
                      </div>

                      {/* Status tracker */}
                      <div className="shrink-0">
                        <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Your status</p>
                        <div className="flex items-center gap-1">
                          {STATUS_FLOW.map((status, idx) => {
                            const cfg = STATUS_CONFIG[status];
                            const done = idx <= currentIdx;
                            return (
                              <button
                                key={status}
                                onClick={() => updateStatusMutation.mutate({ slug: event.slug, status })}
                                className={`text-[10px] px-2 py-1 rounded-lg border font-medium transition-all ${
                                  done ? cfg.color + " border-current/20" : "border-slate-200 text-slate-400"
                                }`}
                                title={cfg.label}
                              >
                                {idx < currentIdx ? <CheckCircle2 className="h-3 w-3 inline" /> : cfg.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Log as achievement when attended */}
                        {currentStatus === "ATTENDED" && (
                          <Link href={`/achievements?prefill=${encodeURIComponent(event.title)}`}>
                            <Button size="sm" variant="outline" className="mt-2 text-xs h-7 w-full">
                              <Trophy className="h-3 w-3 mr-1" />
                              Log as Achievement
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerList>
      )}
    </div>
  );
}
