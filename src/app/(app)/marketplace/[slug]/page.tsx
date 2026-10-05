"use client";

import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeUp } from "@/components/ui/motion";
import { useToast } from "@/components/ui/toast";
import {
  Heart, ExternalLink, MapPin, Laptop, Clock, Trophy, Users,
  CheckCircle2, GraduationCap, Calendar, Globe, ArrowLeft,
  Star, Flame, BookOpen, Mic2, Zap, FlaskConical, Palette,
  HelpCircle, Briefcase, Shield, Share2,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EventDetail {
  id: string;
  slug: string;
  title: string;
  category: string;
  organizerName: string;
  organizerType: string;
  description: string;
  longDescription: string | null;
  coverImageUrl: string | null;
  websiteUrl: string | null;
  registrationUrl: string | null;
  city: string | null;
  state: string | null;
  country: string;
  isOnline: boolean;
  isHybrid: boolean;
  eventStartDate: string | null;
  eventEndDate: string | null;
  registrationDeadline: string | null;
  fee: number | null;
  feeWaiversAvailable: boolean;
  minGrade: number | null;
  maxGrade: number | null;
  minAge: number | null;
  maxAge: number | null;
  eligibleBoards: string | null;
  teamSize: string;
  teamMinSize: number | null;
  teamMaxSize: number | null;
  difficulty: string;
  tags: string | null;
  prizePool: number | null;
  awardsDescription: string | null;
  participantCount: number | null;
  isVerified: boolean;
  isFeatured: boolean;
  isRecurring: boolean;
  recurringFrequency: string | null;
  viewCount: number;
  saveCount: number;
  isSaved: boolean;
  userApplication: { status: string; notes: string | null } | null;
  reviews: {
    id: string;
    rating: number;
    review: string;
    createdAt: string;
    user: { name: string | null; image: string | null };
  }[];
}

// ─── Config ──────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  MUN: { icon: Mic2, color: "bg-cyan-100 text-cyan-700", label: "MUN" },
  OLYMPIAD: { icon: Trophy, color: "bg-amber-100 text-amber-700", label: "Olympiad" },
  HACKATHON: { icon: Zap, color: "bg-purple-100 text-purple-700", label: "Hackathon" },
  RESEARCH: { icon: FlaskConical, color: "bg-indigo-100 text-indigo-700", label: "Research" },
  SCHOLARSHIP: { icon: GraduationCap, color: "bg-emerald-100 text-emerald-700", label: "Scholarship" },
  PROGRAM: { icon: BookOpen, color: "bg-teal-100 text-teal-700", label: "Program" },
  INTERNSHIP: { icon: Briefcase, color: "bg-orange-100 text-orange-700", label: "Internship" },
  ARTS: { icon: Palette, color: "bg-pink-100 text-pink-700", label: "Arts & Culture" },
  QUIZ: { icon: HelpCircle, color: "bg-lime-100 text-lime-700", label: "Quiz & Spell" },
  EXCHANGE: { icon: Globe, color: "bg-sky-100 text-sky-700", label: "Exchange" },
  SPORTS: { icon: Flame, color: "bg-red-100 text-red-700", label: "Sports" },
  OTHER: { icon: Star, color: "bg-slate-100 text-slate-600", label: "Other" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  INTERESTED: { label: "Interested", color: "bg-blue-50 text-blue-600" },
  APPLIED: { label: "Applied", color: "bg-amber-50 text-amber-700" },
  REGISTERED: { label: "Registered", color: "bg-indigo-50 text-indigo-700" },
  ATTENDED: { label: "Attended", color: "bg-emerald-50 text-emerald-700" },
  WITHDREW: { label: "Withdrew", color: "bg-slate-50 text-slate-500" },
};

const DIFFICULTY_COLOR: Record<string, string> = {
  BEGINNER: "bg-emerald-50 text-emerald-700",
  INTERMEDIATE: "bg-amber-50 text-amber-700",
  ADVANCED: "bg-red-50 text-red-700",
  OPEN: "bg-slate-50 text-slate-600",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gradeLabel(min: number | null, max: number | null) {
  const fmt = (g: number) => (g === 13 ? "Undergrad" : g === 14 ? "Postgrad" : `Grade ${g}`);
  if (!min && !max) return "Open to all";
  if (min && max && min === max) return fmt(min);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)} and above`;
  return `Up to ${fmt(max!)}`;
}

function deadlineInfo(deadline: string | null) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  if (days < 0) return { label: `Closed (${dateStr})`, urgent: false, days };
  if (days === 0) return { label: `Closes TODAY — ${dateStr}`, urgent: true, days };
  if (days <= 7) return { label: `${days} day${days === 1 ? "" : "s"} left — ${dateStr}`, urgent: true, days };
  return { label: dateStr, urgent: false, days };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketplaceEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: event, isLoading, error } = useQuery<EventDetail>({
    queryKey: ["marketplace-event", slug],
    queryFn: () =>
      fetch(`/api/marketplace/${slug}`).then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      }),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/marketplace/${slug}/save`, { method: "POST" }).then((r) => r.json()),
    onSuccess: (res) => {
      toast(res.saved ? "Event saved!" : "Removed from saved");
      queryClient.invalidateQueries({ queryKey: ["marketplace-event", slug] });
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-saved"] });
    },
  });

  const applyMutation = useMutation({
    mutationFn: (status: string) =>
      fetch(`/api/marketplace/${slug}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: (_, status) => {
      toast(STATUS_CONFIG[status]?.label + "!");
      queryClient.invalidateQueries({ queryKey: ["marketplace-event", slug] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-saved"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center py-20 gap-4">
        <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Event not found</p>
        <Link href="/marketplace">
          <Button variant="outline">← Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  const cat = CATEGORY_META[event.category] ?? CATEGORY_META.OTHER;
  const CatIcon = cat.icon;
  const deadline = deadlineInfo(event.registrationDeadline);
  const tags: string[] = event.tags ? JSON.parse(event.tags) : [];
  const boards: string[] = event.eligibleBoards ? JSON.parse(event.eligibleBoards) : [];
  const currentStatus = event.userApplication?.status;

  const avgRating =
    event.reviews.length > 0
      ? (event.reviews.reduce((s, r) => s + r.rating, 0) / event.reviews.length).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <FadeUp>
        <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm transition-colors" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
        </Link>
      </FadeUp>

      {/* Hero banner */}
      <FadeUp delay={0.05}>
        <div className="relative rounded-2xl overflow-hidden">
          {event.coverImageUrl ? (
            <img src={event.coverImageUrl} alt={event.title} className="w-full h-52 object-cover" />
          ) : (
            <div className={`w-full h-52 flex items-center justify-center ${cat.color} opacity-80`}>
              <CatIcon className="h-16 w-16 opacity-40" />
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-xs ${cat.color}`}>{cat.label}</Badge>
              {event.isVerified && (
                <Badge className="text-xs bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <Shield className="h-3 w-3 mr-1" /> Verified
                </Badge>
              )}
              {event.isFeatured && (
                <Badge className="text-xs bg-primary-500/20 text-primary-200 border border-primary-400/30">
                  Featured
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => saveMutation.mutate()}
                className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white transition-colors hover:bg-white/30"
              >
                <Heart className={`h-5 w-5 ${event.isSaved ? "fill-red-400 text-red-400" : ""}`} />
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); toast("Link copied!"); }}
                className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white transition-colors hover:bg-white/30"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </FadeUp>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main content */}
        <div className="lg:col-span-2 space-y-5">
          <FadeUp delay={0.08}>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{event.title}</h1>
              <p className="mt-1 text-base" style={{ color: "var(--text-secondary)" }}>{event.organizerName}</p>

              {/* Meta pills */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-full" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                  {event.isOnline ? <Laptop className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                  {event.isOnline ? "Online" : [event.city, event.state].filter(Boolean).join(", ") || "India"}
                </span>
                <span className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-full" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                  <GraduationCap className="h-3.5 w-3.5" />
                  {gradeLabel(event.minGrade, event.maxGrade)}
                </span>
                <span className={`text-sm px-3 py-1 rounded-full ${DIFFICULTY_COLOR[event.difficulty] ?? DIFFICULTY_COLOR.OPEN}`}>
                  {event.difficulty}
                </span>
                <span className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-full" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                  <Users className="h-3.5 w-3.5" />
                  {event.teamSize === "SOLO" ? "Solo" : event.teamSize === "TEAM"
                    ? `Team ${event.teamMinSize ?? ""}–${event.teamMaxSize ?? ""}`
                    : "Solo or Team"}
                </span>
              </div>
            </div>
          </FadeUp>

          {/* Description */}
          <FadeUp delay={0.1}>
            <Card>
              <CardContent>
                <CardTitle className="mb-3">About this Event</CardTitle>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {event.description}
                </p>
                {event.longDescription && (
                  <p className="text-sm leading-relaxed mt-3" style={{ color: "var(--text-secondary)" }}>
                    {event.longDescription}
                  </p>
                )}
              </CardContent>
            </Card>
          </FadeUp>

          {/* Eligibility */}
          <FadeUp delay={0.12}>
            <Card>
              <CardContent>
                <CardTitle className="mb-4">Eligibility</CardTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Grade</p>
                    <p style={{ color: "var(--text-primary)" }}>{gradeLabel(event.minGrade, event.maxGrade)}</p>
                  </div>
                  {(event.minAge || event.maxAge) && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Age</p>
                      <p style={{ color: "var(--text-primary)" }}>
                        {event.minAge && event.maxAge ? `${event.minAge}–${event.maxAge} years` : event.minAge ? `${event.minAge}+ years` : `Up to ${event.maxAge} years`}
                      </p>
                    </div>
                  )}
                  {boards.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Boards</p>
                      <div className="flex flex-wrap gap-1">
                        {boards.map((b) => (
                          <Badge key={b} variant="secondary" className="text-xs">{b}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Participation</p>
                    <p style={{ color: "var(--text-primary)" }}>
                      {event.teamSize === "SOLO" ? "Individual only" : event.teamSize === "TEAM"
                        ? `Teams of ${event.teamMinSize ?? 2}–${event.teamMaxSize ?? "?"}`
                        : "Individual or Team"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeUp>

          {/* Prizes / Awards */}
          {(event.prizePool || event.awardsDescription) && (
            <FadeUp delay={0.14}>
              <Card>
                <CardContent>
                  <CardTitle className="mb-3">
                    <Trophy className="h-4 w-4 inline mr-2 text-amber-500" />
                    Awards & Prizes
                  </CardTitle>
                  {event.prizePool && (
                    <div className="text-2xl font-bold text-amber-600 mb-2">
                      ₹{event.prizePool.toLocaleString("en-IN")} prize pool
                    </div>
                  )}
                  {event.awardsDescription && (
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{event.awardsDescription}</p>
                  )}
                </CardContent>
              </Card>
            </FadeUp>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <FadeUp delay={0.15}>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                    #{t}
                  </span>
                ))}
              </div>
            </FadeUp>
          )}

          {/* Reviews */}
          {event.reviews.length > 0 && (
            <FadeUp delay={0.16}>
              <Card>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <CardTitle>Reviews</CardTitle>
                    {avgRating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-amber-600">{avgRating}</span>
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>({event.reviews.length})</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {event.reviews.slice(0, 3).map((r) => (
                      <div key={r.id} className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0">
                          {r.user.name?.[0] ?? "?"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{r.user.name ?? "Student"}</span>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{r.review}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </FadeUp>
          )}
        </div>

        {/* Right: Action sidebar */}
        <div className="space-y-4">
          {/* Deadline card */}
          {deadline && (
            <FadeUp delay={0.1}>
              <Card className={deadline.urgent ? "border-2 border-red-300" : ""}>
                <CardContent>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className={`h-4 w-4 ${deadline.urgent ? "text-red-500" : ""}`} style={!deadline.urgent ? { color: "var(--text-muted)" } : undefined} />
                    <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Registration Deadline</span>
                  </div>
                  <p className={`text-base font-bold ${deadline.urgent ? "text-red-600" : ""}`} style={!deadline.urgent ? { color: "var(--text-primary)" } : undefined}>
                    {deadline.label}
                  </p>
                </CardContent>
              </Card>
            </FadeUp>
          )}

          {/* Fee card */}
          <FadeUp delay={0.12}>
            <Card>
              <CardContent>
                <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Entry Fee</p>
                <p className={`text-2xl font-bold ${event.fee === null ? "text-emerald-600" : ""}`} style={event.fee !== null ? { color: "var(--text-primary)" } : undefined}>
                  {event.fee === null ? "Free" : `₹${event.fee.toLocaleString("en-IN")}`}
                </p>
                {event.feeWaiversAvailable && (
                  <p className="text-xs mt-1 text-emerald-600">Fee waivers available</p>
                )}
              </CardContent>
            </Card>
          </FadeUp>

          {/* Key dates */}
          {(event.eventStartDate || event.eventEndDate) && (
            <FadeUp delay={0.13}>
              <Card>
                <CardContent>
                  <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Event Dates</p>
                  <div className="space-y-2 text-sm">
                    {event.eventStartDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary-500 shrink-0" />
                        <span style={{ color: "var(--text-primary)" }}>
                          {new Date(event.eventStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </div>
                    )}
                    {event.eventEndDate && event.eventEndDate !== event.eventStartDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary-500 shrink-0" />
                        <span style={{ color: "var(--text-muted)" }}>
                          to {new Date(event.eventEndDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </FadeUp>
          )}

          {/* Your status */}
          <FadeUp delay={0.14}>
            <Card>
              <CardContent>
                <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Your Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {["INTERESTED", "APPLIED", "REGISTERED", "ATTENDED"].map((status) => {
                    const cfg = STATUS_CONFIG[status];
                    const active = currentStatus === status;
                    return (
                      <button
                        key={status}
                        onClick={() => applyMutation.mutate(status)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border font-medium transition-all ${
                          active ? cfg.color + " border-current/30 shadow-sm" : "border-slate-200"
                        }`}
                        style={!active ? { color: "var(--text-muted)" } : undefined}
                      >
                        {active && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>

                {currentStatus === "ATTENDED" && (
                  <Link href={`/achievements?prefill=${encodeURIComponent(event.title)}`} className="block mt-3">
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      <Trophy className="h-3.5 w-3.5 mr-1.5" />
                      Log as Achievement
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </FadeUp>

          {/* CTAs */}
          <FadeUp delay={0.15}>
            <div className="space-y-2">
              {event.registrationUrl && (
                <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full">
                    Register Now
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </a>
              )}
              {event.websiteUrl && (
                <a href={event.websiteUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="outline" className="w-full">
                    Visit Website
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </a>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => saveMutation.mutate()}
              >
                <Heart className={`h-4 w-4 mr-2 ${event.isSaved ? "fill-red-500 text-red-500" : ""}`} />
                {event.isSaved ? "Saved" : "Save Event"}
              </Button>
            </div>
          </FadeUp>

          {/* Stats */}
          <FadeUp delay={0.16}>
            <div className="flex gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
              <span><Users className="h-3.5 w-3.5 inline mr-1" />{event.saveCount} saved</span>
              <span>{event.viewCount} views</span>
              {event.participantCount && <span>{event.participantCount.toLocaleString("en-IN")}+ participants</span>}
            </div>
          </FadeUp>
        </div>
      </div>
    </div>
  );
}
