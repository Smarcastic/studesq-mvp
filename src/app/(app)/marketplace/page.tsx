"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { FadeUp, StaggerList, StaggerItem } from "@/components/ui/motion";
import { useToast } from "@/components/ui/toast";
import {
  Search, Heart, Calendar, ExternalLink, MapPin, Trophy, Users,
  Globe, Laptop, Filter, Star, Flame, Zap, BookOpen, Mic2,
  FlaskConical, Palette, HelpCircle, GraduationCap, Briefcase,
  ArrowRight, Clock, X, ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MarketplaceEvent {
  id: string;
  slug: string;
  title: string;
  category: string;
  organizerName: string;
  organizerType: string;
  description: string;
  coverImageUrl: string | null;
  city: string | null;
  state: string | null;
  isOnline: boolean;
  isHybrid: boolean;
  eventStartDate: string | null;
  eventEndDate: string | null;
  registrationDeadline: string | null;
  fee: number | null;
  minGrade: number | null;
  maxGrade: number | null;
  difficulty: string;
  teamSize: string;
  tags: string | null;
  prizePool: number | null;
  isVerified: boolean;
  isFeatured: boolean;
  isRecurring: boolean;
  viewCount: number;
  saveCount: number;
  score?: number;
}

interface ListResponse {
  events: MarketplaceEvent[];
  total: number;
  page: number;
  hasMore: boolean;
  savedEventIds: string[];
}

// ─── Config ─────────────────────────────────────────────────────────────────

const CATEGORIES: { value: string; label: string; icon: React.ElementType; color: string }[] = [
  { value: "", label: "All", icon: Star, color: "bg-slate-100 text-slate-600" },
  { value: "MUN", label: "MUN", icon: Mic2, color: "bg-cyan-100 text-cyan-700" },
  { value: "OLYMPIAD", label: "Olympiad", icon: Trophy, color: "bg-amber-100 text-amber-700" },
  { value: "HACKATHON", label: "Hackathon", icon: Zap, color: "bg-purple-100 text-purple-700" },
  { value: "RESEARCH", label: "Research", icon: FlaskConical, color: "bg-indigo-100 text-indigo-700" },
  { value: "SCHOLARSHIP", label: "Scholarship", icon: GraduationCap, color: "bg-emerald-100 text-emerald-700" },
  { value: "PROGRAM", label: "Program", icon: BookOpen, color: "bg-teal-100 text-teal-700" },
  { value: "INTERNSHIP", label: "Internship", icon: Briefcase, color: "bg-orange-100 text-orange-700" },
  { value: "ARTS", label: "Arts & Culture", icon: Palette, color: "bg-pink-100 text-pink-700" },
  { value: "QUIZ", label: "Quiz & Spell", icon: HelpCircle, color: "bg-lime-100 text-lime-700" },
  { value: "EXCHANGE", label: "Exchange", icon: Globe, color: "bg-sky-100 text-sky-700" },
  { value: "SPORTS", label: "Sports", icon: Flame, color: "bg-red-100 text-red-700" },
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Multiple States",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFee(fee: number | null) {
  if (fee === null) return "Free";
  return `₹${fee.toLocaleString("en-IN")}`;
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Closed", color: "text-slate-500" };
  if (days === 0) return { label: "Closes today", color: "text-red-600" };
  if (days <= 7) return { label: `${days}d left`, color: "text-red-500" };
  if (days <= 30) return { label: `${days}d left`, color: "text-amber-600" };
  return { label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), color: "text-slate-500" };
}

function gradeLabel(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const fmt = (g: number) => g === 13 ? "UG" : g === 14 ? "PG" : `Gr ${g}`;
  if (min && max && min === max) return fmt(min);
  if (min && max) return `${fmt(min)}–${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({
  event,
  isSaved,
  onToggleSave,
}: {
  event: MarketplaceEvent;
  isSaved: boolean;
  onToggleSave: (slug: string) => void;
}) {
  const deadline = formatDeadline(event.registrationDeadline);
  const cat = CATEGORIES.find((c) => c.value === event.category);
  const tags: string[] = event.tags ? JSON.parse(event.tags) : [];

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md ${
        event.isFeatured ? "border-primary-300" : ""
      }`}
      style={{ background: "var(--bg-card)", borderColor: event.isFeatured ? undefined : "var(--border-subtle)" }}
    >
      {/* Featured ribbon */}
      {event.isFeatured && (
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-500 text-white">
            Featured
          </span>
        </div>
      )}

      {/* Save button */}
      <button
        onClick={(e) => { e.preventDefault(); onToggleSave(event.slug); }}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg backdrop-blur-sm transition-colors"
        style={{ background: "var(--bg-card)" }}
      >
        <Heart
          className={`h-4 w-4 transition-colors ${isSaved ? "fill-red-500 text-red-500" : ""}`}
          style={!isSaved ? { color: "var(--text-muted)" } : undefined}
        />
      </button>

      {/* Cover / category banner */}
      {event.coverImageUrl ? (
        <img src={event.coverImageUrl} alt={event.title} className="w-full h-28 object-cover" />
      ) : (
        <div className={`w-full h-20 flex items-center justify-center ${cat?.color ?? "bg-slate-100"} opacity-80`}>
          {cat && <cat.icon className="h-8 w-8 opacity-60" />}
        </div>
      )}

      <div className="p-4">
        {/* Category + verification */}
        <div className="flex items-center gap-1.5 mb-2">
          <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 ${cat?.color ?? ""}`}>
            {cat?.label ?? event.category}
          </Badge>
          {event.isVerified && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">✓ Verified</span>
          )}
          {event.score !== undefined && event.score >= 60 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-50 text-cyan-600 font-medium">
              {event.score}% match
            </span>
          )}
        </div>

        {/* Title */}
        <Link href={`/marketplace/${event.slug}`}>
          <h3 className="font-semibold text-sm leading-snug hover:text-primary-600 transition-colors line-clamp-2" style={{ color: "var(--text-primary)" }}>
            {event.title}
          </h3>
        </Link>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{event.organizerName}</p>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1">
            {event.isOnline ? <Laptop className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
            {event.isOnline ? "Online" : (event.city ?? event.state ?? "India")}
          </span>
          <span className="flex items-center gap-1">
            <GraduationCap className="h-3 w-3" />
            {gradeLabel(event.minGrade, event.maxGrade) ?? "All grades"}
          </span>
          <span className={`flex items-center gap-1 font-medium ${event.fee === null ? "text-emerald-600" : ""}`}>
            {formatFee(event.fee)}
          </span>
        </div>

        {/* Deadline */}
        {deadline && (
          <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${deadline.color}`}>
            <Clock className="h-3 w-3" />
            {deadline.label}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                {t}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{event.saveCount}</span>
          </div>
          <Link href={`/marketplace/${event.slug}`}>
            <Button size="sm" variant="outline" className="text-xs h-7 px-2">
              View <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  const [isOnlineOnly, setIsOnlineOnly] = useState(false);
  const [isFreeOnly, setIsFreeOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (state) params.set("state", state);
    if (isOnlineOnly) params.set("isOnline", "true");
    if (isFreeOnly) params.set("isFree", "true");
    params.set("limit", "30");
    return `/api/marketplace?${params.toString()}`;
  }, [q, category, state, isOnlineOnly, isFreeOnly]);

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["marketplace", q, category, state, isOnlineOnly, isFreeOnly],
    queryFn: () => fetch(buildUrl()).then((r) => r.json()),
    placeholderData: (prev) => prev,
  });

  const { data: recommended } = useQuery<(MarketplaceEvent & { score: number; isSaved: boolean })[]>({
    queryKey: ["marketplace-recommended"],
    queryFn: () => fetch("/api/marketplace/recommended").then((r) => r.json()),
  });

  const savedIds = new Set(data?.savedEventIds ?? []);

  const saveMutation = useMutation({
    mutationFn: (slug: string) =>
      fetch(`/api/marketplace/${slug}/save`, { method: "POST" }).then((r) => r.json()),
    onSuccess: (res, slug) => {
      toast(res.saved ? "Event saved!" : "Removed from saved");
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-recommended"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-saved"] });
    },
  });

  const events = data?.events ?? [];
  const hasFilters = !!(q || category || state || isOnlineOnly || isFreeOnly);

  return (
    <div>
      <PageHeader
        title="Marketplace"
        action={
          <Link href="/marketplace/saved">
            <Button variant="outline" size="sm">
              <Heart className="h-4 w-4" />
              Saved Events
            </Button>
          </Link>
        }
      />

      <div className="space-y-6">
        {/* Search bar */}
        <FadeUp>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: "var(--text-muted)" }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search competitions, scholarships, MUNs, olympiads..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border text-sm outline-none"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-normal)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </FadeUp>

        {/* Category chips */}
        <FadeUp delay={0.05}>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = category === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(active ? "" : cat.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                    active ? "border-primary-400 shadow-sm" : "border-transparent"
                  } ${cat.color}`}
                  style={active ? { background: "var(--bg-card)" } : undefined}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </FadeUp>

        {/* Filter bar */}
        <FadeUp delay={0.08}>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-colors"
              style={{
                background: filtersOpen ? "var(--bg-elevated)" : "var(--bg-card)",
                borderColor: "var(--border-normal)",
                color: "var(--text-secondary)",
              }}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Active filter pills */}
            {isOnlineOnly && (
              <span
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-cyan-50 text-cyan-700 cursor-pointer"
                onClick={() => setIsOnlineOnly(false)}
              >
                Online only <X className="h-3 w-3" />
              </span>
            )}
            {isFreeOnly && (
              <span
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 cursor-pointer"
                onClick={() => setIsFreeOnly(false)}
              >
                Free only <X className="h-3 w-3" />
              </span>
            )}
            {state && (
              <span
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 cursor-pointer"
                onClick={() => setState("")}
              >
                {state} <X className="h-3 w-3" />
              </span>
            )}
            {hasFilters && (
              <button
                onClick={() => { setQ(""); setCategory(""); setState(""); setIsOnlineOnly(false); setIsFreeOnly(false); }}
                className="text-xs px-2 py-1 rounded-full text-red-500"
              >
                Clear all
              </button>
            )}

            <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
              {isLoading ? "Loading…" : `${data?.total ?? 0} events`}
            </span>
          </div>

          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mt-2"
              >
                <div className="flex flex-wrap gap-3 p-4 rounded-xl border" style={{ background: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}>
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-secondary)" }}>
                    <input type="checkbox" checked={isOnlineOnly} onChange={(e) => setIsOnlineOnly(e.target.checked)} className="rounded" />
                    Online only
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-secondary)" }}>
                    <input type="checkbox" checked={isFreeOnly} onChange={(e) => setIsFreeOnly(e.target.checked)} className="rounded" />
                    Free only
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="text-sm px-3 py-1.5 rounded-lg border outline-none"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border-normal)", color: "var(--text-secondary)" }}
                  >
                    <option value="">All States</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </FadeUp>

        {/* Recommended for you (only when no search/filter active) */}
        {!hasFilters && recommended && recommended.length > 0 && (
          <FadeUp delay={0.1}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-amber-500" />
                <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                  Recommended for You
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommended.slice(0, 3).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isSaved={event.isSaved}
                    onToggleSave={(slug) => saveMutation.mutate(slug)}
                  />
                ))}
              </div>
            </div>
          </FadeUp>
        )}

        {/* Main event grid */}
        <div>
          {!hasFilters && (
            <h2 className="font-semibold text-sm mb-3" style={{ color: "var(--text-primary)" }}>
              All Events
            </h2>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="py-16 flex flex-col items-center gap-3">
                <Search className="h-10 w-10" style={{ color: "var(--text-muted)" }} />
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>No events found</p>
                <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
                  Try a different search or clear your filters.
                </p>
                {hasFilters && (
                  <Button variant="outline" size="sm" onClick={() => { setQ(""); setCategory(""); setState(""); setIsOnlineOnly(false); setIsFreeOnly(false); }}>
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <StaggerItem key={event.id}>
                  <EventCard
                    event={event}
                    isSaved={savedIds.has(event.id)}
                    onToggleSave={(slug) => saveMutation.mutate(slug)}
                  />
                </StaggerItem>
              ))}
            </StaggerList>
          )}
        </div>
      </div>
    </div>
  );
}
