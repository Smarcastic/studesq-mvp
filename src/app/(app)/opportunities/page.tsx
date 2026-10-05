"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { FadeUp, StaggerList, StaggerItem } from "@/components/ui/motion";
import { motion, AnimatePresence } from "framer-motion";
import { scoreOpportunityMatch } from "@/lib/ai-engine";
import {
  Search,
  Heart,
  Calendar,
  ExternalLink,
  Clock,
  Award,
  Compass,
  Sparkles,
  Trophy,
  GraduationCap,
  Users,
  BookOpen,
} from "lucide-react";

// =====================================================================
// Types & Data
// =====================================================================

interface Opportunity {
  id: string;
  title: string;
  type: "scholarship" | "competition" | "internship" | "program" | "volunteer";
  description: string;
  deadline: Date;
  organization: string;
  url: string;
  tags: string[];
  eligibility: string;
  award: string;
}

const OPPORTUNITIES: Opportunity[] = [
  // Scholarships
  { id: "s1", title: "STEM Innovators Scholarship", type: "scholarship", description: "Full-tuition scholarship for students demonstrating excellence in STEM fields with a minimum 3.5 GPA.", deadline: new Date(Date.now() + 45 * 86400000), organization: "National Science Foundation", url: "#", tags: ["STEM", "GPA", "science"], eligibility: "High school juniors/seniors, 3.5+ GPA", award: "$25,000/year" },
  { id: "s2", title: "Future Leaders Arts Grant", type: "scholarship", description: "Award for students who combine artistic talent with community leadership and service.", deadline: new Date(Date.now() + 60 * 86400000), organization: "Arts Education Alliance", url: "#", tags: ["arts", "leadership", "creative"], eligibility: "Grades 10-12, portfolio required", award: "$10,000" },
  { id: "s3", title: "Community Impact Scholarship", type: "scholarship", description: "For students who have demonstrated significant community service impact of 100+ hours.", deadline: new Date(Date.now() + 30 * 86400000), organization: "Rotary International", url: "#", tags: ["community", "service", "volunteer"], eligibility: "100+ service hours documented", award: "$15,000" },
  { id: "s4", title: "Women in Technology Scholarship", type: "scholarship", description: "Supporting young women pursuing careers in technology, computer science, and engineering.", deadline: new Date(Date.now() + 75 * 86400000), organization: "Tech Women Foundation", url: "#", tags: ["technology", "women", "CS", "engineering"], eligibility: "Female-identifying students, interest in tech", award: "$20,000" },
  { id: "s5", title: "First-Gen College Bound Award", type: "scholarship", description: "Scholarship supporting first-generation college students with financial need and strong academics.", deadline: new Date(Date.now() + 20 * 86400000), organization: "College Access Network", url: "#", tags: ["first-gen", "financial aid", "academic"], eligibility: "First-generation college students", award: "$12,000" },
  // Competitions
  { id: "c1", title: "National Math Olympiad", type: "competition", description: "Prestigious mathematics competition testing problem-solving skills across algebra, geometry, and combinatorics.", deadline: new Date(Date.now() + 25 * 86400000), organization: "Mathematical Association of America", url: "#", tags: ["math", "olympiad", "problem-solving"], eligibility: "All high school students", award: "Gold/Silver/Bronze medals + $5,000" },
  { id: "c2", title: "Regional Science Fair", type: "competition", description: "Annual science fair showcasing original research projects in biology, chemistry, physics, and engineering.", deadline: new Date(Date.now() + 35 * 86400000), organization: "Society for Science", url: "#", tags: ["science", "research", "STEM"], eligibility: "Grades 9-12, original project", award: "Awards up to $10,000" },
  { id: "c3", title: "Congressional Debate Championship", type: "competition", description: "National debate tournament covering policy, Lincoln-Douglas, and public forum divisions.", deadline: new Date(Date.now() + 50 * 86400000), organization: "National Speech & Debate Association", url: "#", tags: ["debate", "public speaking", "policy"], eligibility: "NSDA member schools", award: "National recognition + scholarships" },
  // Internships
  { id: "i1", title: "Google CSSI Summer Program", type: "internship", description: "Intensive 4-week computer science summer program at Google for rising college freshmen.", deadline: new Date(Date.now() + 40 * 86400000), organization: "Google", url: "#", tags: ["CS", "Google", "coding", "summer"], eligibility: "Rising college freshmen, CS interest", award: "Stipend + travel + housing" },
  { id: "i2", title: "NIH High School Research Program", type: "internship", description: "8-week summer research internship at the National Institutes of Health working alongside scientists.", deadline: new Date(Date.now() + 55 * 86400000), organization: "National Institutes of Health", url: "#", tags: ["research", "biology", "health", "science"], eligibility: "Age 16+, US citizen/resident", award: "Research stipend" },
  { id: "i3", title: "Local Tech Startup Internship", type: "internship", description: "Part-time internship with a local tech startup gaining real-world engineering and product experience.", deadline: new Date(Date.now() + 10 * 86400000), organization: "Portland Tech Hub", url: "#", tags: ["startup", "engineering", "product"], eligibility: "Juniors/Seniors with coding experience", award: "$18/hour, 15 hrs/week" },
  // Programs
  { id: "p1", title: "MIT LaunchX Entrepreneurship", type: "program", description: "Summer entrepreneurship program where students launch real startups with mentorship from MIT.", deadline: new Date(Date.now() + 65 * 86400000), organization: "MIT", url: "#", tags: ["entrepreneurship", "MIT", "startup", "business"], eligibility: "Grades 10-12, application required", award: "Full program + mentorship" },
  { id: "p2", title: "Stanford Pre-Collegiate Studies", type: "program", description: "3-week intensive academic program on Stanford campus in humanities, sciences, or engineering.", deadline: new Date(Date.now() + 80 * 86400000), organization: "Stanford University", url: "#", tags: ["Stanford", "pre-college", "academic"], eligibility: "Grades 10-11, strong academic record", award: "Certificate + college prep" },
  // Volunteer
  { id: "v1", title: "Habitat for Humanity Build", type: "volunteer", description: "Weekend build events constructing affordable housing for families in need within the community.", deadline: new Date(Date.now() + 15 * 86400000), organization: "Habitat for Humanity", url: "#", tags: ["construction", "housing", "community"], eligibility: "Age 16+, no experience needed", award: "Service hours + community impact" },
  { id: "v2", title: "Youth STEM Tutoring Initiative", type: "volunteer", description: "Mentor and tutor middle school students in math and science through after-school programs.", deadline: new Date(Date.now() + 22 * 86400000), organization: "Boys & Girls Club", url: "#", tags: ["tutoring", "STEM", "mentoring", "youth"], eligibility: "Strong in math/science", award: "Service hours + recommendation letters" },
];

const MOCK_PROFILE = {
  interests: ["Computer Science", "Mathematics", "Robotics"],
  skills: ["Python", "JavaScript", "Public Speaking"],
  achievements: [
    { category: "competition", title: "Science Fair" },
    { category: "academic", title: "AP CS" },
    { category: "leadership", title: "Robotics VP" },
  ],
  grade: "Junior",
};

const TYPE_BADGE: Record<string, "success" | "warning" | "info" | "teal" | "primary"> = {
  scholarship: "success",
  competition: "warning",
  internship: "info",
  program: "teal",
  volunteer: "primary",
};

const TYPE_ICON: Record<string, typeof Award> = {
  scholarship: GraduationCap,
  competition: Trophy,
  internship: BookOpen,
  program: Sparkles,
  volunteer: Users,
};

const TABS = [
  { id: "all", label: "All" },
  { id: "scholarship", label: "Scholarships" },
  { id: "competition", label: "Competitions" },
  { id: "internship", label: "Internships" },
  { id: "program", label: "Programs" },
  { id: "volunteer", label: "Volunteer" },
];

function daysUntil(date: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
}

function deadlineColor(days: number): string {
  if (days < 14) return "text-red-500";
  if (days < 30) return "text-amber-500";
  return "text-emerald-500";
}

// =====================================================================
// Component
// =====================================================================

export default function OpportunitiesPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = OPPORTUNITIES;
    if (typeFilter !== "all") list = list.filter((o) => o.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          o.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [typeFilter, search]);

  const closingSoon = OPPORTUNITIES.filter((o) => daysUntil(o.deadline) < 14).length;

  return (
    <div>
      <PageHeader
        title="Opportunities"
        description="Discover scholarships, competitions, internships, and programs matched to your profile."
        action={
          <Badge variant="teal">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Match Scoring
          </Badge>
        }
      />

      {/* Stats Bar */}
      <FadeUp>
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
          <span className="text-slate-500">
            <Compass className="h-4 w-4 inline mr-1" />
            {OPPORTUNITIES.length} opportunities
          </span>
          <span className="text-red-500 font-medium">
            <Clock className="h-4 w-4 inline mr-1" />
            {closingSoon} closing soon
          </span>
          <span className="text-cyan-600 font-medium">
            <Heart className="h-4 w-4 inline mr-1" />
            {saved.size} saved
          </span>
        </div>
      </FadeUp>

      {/* Filters */}
      <FadeUp delay={0.05}>
        <div className="space-y-4 mb-6">
          <Tabs tabs={TABS} activeTab={typeFilter} onChange={setTypeFilter} />
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="opp-search"
              placeholder="Search by title, description, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </FadeUp>

      {/* Grid */}
      <AnimatePresence mode="wait">
        {filtered.length > 0 ? (
          <motion.div
            key={`${typeFilter}-${search}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((opp) => {
                const days = daysUntil(opp.deadline);
                const match = scoreOpportunityMatch(
                  { type: opp.type, tags: opp.tags, title: opp.title, description: opp.description },
                  MOCK_PROFILE
                );
                const Icon = TYPE_ICON[opp.type] || Award;

                return (
                  <StaggerItem key={opp.id}>
                    <Card className="relative group hover-lift h-full flex flex-col">
                      {/* Save button */}
                      <button
                        onClick={() => toggleSave(opp.id)}
                        className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-50 transition-colors z-10"
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${
                            saved.has(opp.id)
                              ? "fill-red-500 text-red-500"
                              : "text-slate-300 group-hover:text-slate-400"
                          }`}
                        />
                      </button>

                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3 pr-8">
                        <div className="p-2 rounded-lg bg-slate-50 shrink-0">
                          <Icon className="h-5 w-5 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant={TYPE_BADGE[opp.type] || "default"}>
                              {opp.type}
                            </Badge>
                            {match.score >= 60 && (
                              <Badge variant="teal">
                                <Sparkles className="h-3 w-3 mr-0.5" />
                                {match.score}% match
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                            {opp.title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {opp.organization}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-500 line-clamp-2 mb-3 flex-1">
                        {opp.description}
                      </p>

                      {/* Award */}
                      <div className="flex items-center gap-1.5 mb-3 text-xs">
                        <Award className="h-3.5 w-3.5 text-amber-500" />
                        <span className="font-medium text-slate-700">{opp.award}</span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {opp.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 text-slate-500 border border-slate-100"
                          >
                            {tag}
                          </span>
                        ))}
                        {opp.tags.length > 3 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] text-slate-400">
                            +{opp.tags.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Match reasons */}
                      {match.reasons.length > 0 && match.score >= 50 && (
                        <div className="mb-3 p-2 rounded-lg bg-cyan-50/50 border border-cyan-100">
                          <p className="text-[10px] font-semibold text-cyan-700 mb-0.5">
                            Why you match:
                          </p>
                          {match.reasons.slice(0, 2).map((r, i) => (
                            <p key={i} className="text-[10px] text-cyan-600">
                              {r}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                        <span className={`text-xs font-medium flex items-center gap-1 ${deadlineColor(days)}`}>
                          <Calendar className="h-3 w-3" />
                          {days === 0
                            ? "Closes today!"
                            : days === 1
                            ? "1 day left"
                            : `${days} days left`}
                        </span>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-3 w-3" />
                          Learn More
                        </Button>
                      </div>
                    </Card>
                  </StaggerItem>
                );
              })}
            </StaggerList>
          </motion.div>
        ) : (
          <FadeUp>
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title="No opportunities found"
              description="Try adjusting your search or filter to discover more."
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              }
            />
          </FadeUp>
        )}
      </AnimatePresence>
    </div>
  );
}
