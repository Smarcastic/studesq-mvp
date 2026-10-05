"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  CalendarClock,
  Target,
  GraduationCap,
  Store,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";

type EventType = "assignment" | "exam" | "goal" | "application" | "marketplace";

interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  date: string;
  subtitle?: string;
  href: string;
  meta?: string;
  isDone?: boolean;
}

const TYPE_CONFIG: Record<EventType, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  assignment: { label: "Assignment", color: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500", icon: CheckSquare },
  exam: { label: "Exam", color: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500", icon: CalendarClock },
  goal: { label: "Goal", color: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500", icon: Target },
  application: { label: "Application", color: "bg-indigo-50 text-indigo-700 border-indigo-100", dot: "bg-indigo-500", icon: GraduationCap },
  marketplace: { label: "Event", color: "bg-cyan-50 text-cyan-700 border-cyan-100", dot: "bg-cyan-500", icon: Store },
};

const FILTER_TYPES: EventType[] = ["assignment", "exam", "goal", "application", "marketplace"];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [activeFilters, setActiveFilters] = useState<Set<EventType>>(new Set(FILTER_TYPES));

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["calendar"],
    queryFn: () => fetch("/api/calendar").then((r) => r.json()),
  });

  // Build a map: "YYYY-MM-DD" → events[]
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      if (!activeFilters.has(ev.type)) continue;
      const d = new Date(ev.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return map;
  }, [events, activeFilters]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const selectedKey = selectedDay
    ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : null;
  const selectedEvents = selectedKey ? (eventsByDate.get(selectedKey) ?? []) : [];

  // Upcoming events (next 30 days from today, sorted)
  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    const in30d = now + 30 * 24 * 60 * 60 * 1000;
    return events
      .filter(ev => activeFilters.has(ev.type))
      .filter(ev => {
        const t = new Date(ev.date).getTime();
        return t >= now && t <= in30d;
      })
      .slice(0, 10);
  }, [events, activeFilters]);

  const toggleFilter = (type: EventType) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  return (
    <div>
      <PageHeader title="Calendar" />

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTER_TYPES.map((type) => {
          const cfg = TYPE_CONFIG[type];
          const Icon = cfg.icon;
          const active = activeFilters.has(type);
          return (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                active ? cfg.color : "bg-transparent text-slate-400 border-slate-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        {/* Calendar grid */}
        <Card>
          <CardContent>
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg transition-colors hover:bg-slate-100"
                style={{ color: "var(--text-muted)" }}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg transition-colors hover:bg-slate-100"
                style={{ color: "var(--text-muted)" }}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[11px] font-semibold py-1" style={{ color: "var(--text-muted)" }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            {isLoading ? (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayEvents = eventsByDate.get(key) ?? [];
                  const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                  const isSelected = day === selectedDay;
                  const types = [...new Set(dayEvents.map(e => e.type))] as EventType[];

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                      className={`relative flex flex-col items-center justify-start p-1.5 rounded-xl min-h-[52px] transition-all ${
                        isSelected
                          ? "bg-cyan-500 text-white shadow-md"
                          : isToday
                          ? "bg-cyan-50 border border-cyan-200"
                          : dayEvents.length > 0
                          ? "hover:bg-slate-50"
                          : "hover:bg-slate-50/50"
                      }`}
                    >
                      <span className={`text-xs font-medium ${isSelected ? "text-white" : isToday ? "text-cyan-600" : ""}`}
                        style={!isSelected && !isToday ? { color: "var(--text-primary)" } : undefined}
                      >
                        {day}
                      </span>
                      {/* Event dots */}
                      {types.length > 0 && (
                        <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                          {types.slice(0, 3).map(type => (
                            <span
                              key={type}
                              className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white/80" : TYPE_CONFIG[type].dot}`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Selected day events */}
          {selectedDay && (
            <FadeUp>
              <Card>
                <CardContent>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                    {MONTHS[month]} {selectedDay}
                    {selectedEvents.length > 0 && (
                      <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                        · {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </h3>
                  {selectedEvents.length === 0 ? (
                    <div className="flex flex-col items-center py-6 gap-2">
                      <CalendarDays className="h-8 w-8 opacity-20" style={{ color: "var(--text-muted)" }} />
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nothing scheduled</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedEvents.map((ev) => {
                        const cfg = TYPE_CONFIG[ev.type];
                        const Icon = cfg.icon;
                        return (
                          <Link key={ev.id} href={ev.href}>
                            <div className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors hover:opacity-80 ${cfg.color} ${ev.isDone ? "opacity-50" : ""}`}>
                              <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              <div className="min-w-0">
                                <p className={`text-xs font-medium truncate ${ev.isDone ? "line-through" : ""}`}>
                                  {ev.title}
                                </p>
                                {ev.subtitle && (
                                  <p className="text-[10px] opacity-70 truncate">{ev.subtitle}</p>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </FadeUp>
          )}

          {/* Upcoming 30 days */}
          <Card>
            <CardContent>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                Upcoming — next 30 days
              </h3>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 rounded-xl" />)}
                </div>
              ) : upcomingEvents.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>Nothing coming up</p>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.map((ev) => {
                    const cfg = TYPE_CONFIG[ev.type];
                    const Icon = cfg.icon;
                    const d = new Date(ev.date);
                    const daysLeft = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <Link key={ev.id} href={ev.href}>
                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors hover:bg-slate-50" style={{ borderColor: "var(--border-subtle)" }}>
                          <div className={`p-1.5 rounded-lg shrink-0 ${cfg.color}`}>
                            <Icon className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{ev.title}</p>
                            {ev.subtitle && (
                              <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{ev.subtitle}</p>
                            )}
                          </div>
                          <span className={`text-[10px] font-medium shrink-0 ${daysLeft <= 2 ? "text-red-500" : daysLeft <= 7 ? "text-amber-600" : ""}`}
                            style={daysLeft > 7 ? { color: "var(--text-muted)" } : undefined}
                          >
                            {daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d`}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
