import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import {
  BookOpen,
  Timer,
  BarChart3,
  Trophy,
  Brain,
  Target,
  ArrowRight,
  Sparkles,
  GraduationCap,
} from "lucide-react";

const FEATURES = [
  {
    icon: Timer,
    title: "Focus Timer",
    description: "Pomodoro, deep focus, and stopwatch modes with distraction tracking.",
    color: "text-cyan-500",
    bg: "bg-cyan-50 dark:bg-cyan-500/10",
  },
  {
    icon: Brain,
    title: "Smart Flashcards",
    description: "Spaced repetition algorithm adapts to how well you know each card.",
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-500/10",
  },
  {
    icon: Target,
    title: "Goal Tracking",
    description: "Set academic goals with milestones and track progress over time.",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
  },
  {
    icon: BarChart3,
    title: "Study Analytics",
    description: "Heatmaps, streaks, and insights that help you study smarter.",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-500/10",
  },
  {
    icon: BookOpen,
    title: "Notes & Assignments",
    description: "Rich editor for notes, plus assignment tracking with priority sorting.",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-500/10",
  },
  {
    icon: Trophy,
    title: "Badges & XP",
    description: "Earn experience points and unlock badges as you build consistency.",
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-500/10",
  },
];

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Studes<span className="text-primary-500">Q</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-20 pb-24 max-w-4xl mx-auto text-center relative">
        {/* Glow effects */}
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl -z-10" />
        <div className="absolute top-20 right-1/4 w-72 h-72 bg-secondary-400/20 rounded-full blur-3xl -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 bg-primary-50 dark:bg-primary-500/10 text-primary-600">
          <Sparkles className="h-3.5 w-3.5" />
          Built for students who care about growth
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6" style={{ color: 'var(--text-primary)' }}>
          Your Growth,{" "}
          <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
            Your Terms
          </span>
        </h1>

        <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10" style={{ color: 'var(--text-secondary)' }}>
          The all-in-one student platform for study tracking, smart flashcards,
          habit building, and academic growth — powered by insights, not pressure.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium text-lg transition-opacity hover:opacity-90"
          >
            <GraduationCap className="h-5 w-5" />
            Start for Free
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border font-medium text-lg transition-colors hover:opacity-80"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-normal)' }}
          >
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4" style={{ color: 'var(--text-primary)' }}>
          Everything you need to study better
        </h2>
        <p className="text-center max-w-xl mx-auto mb-12" style={{ color: 'var(--text-muted)' }}>
          Tools designed for real students — not just another todo list.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="p-5 rounded-2xl border transition-all hover:shadow-md"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <div className={`inline-flex p-2.5 rounded-xl mb-3 ${feature.bg}`}>
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <h3 className="font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 max-w-3xl mx-auto text-center">
        <div
          className="p-10 rounded-3xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Ready to level up?
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
            Join StudesQ and start building better study habits today.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium transition-opacity hover:opacity-90"
          >
            Create Free Account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Studes<span className="text-primary-500">Q</span>
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Your Growth, Your Terms.
          </p>
        </div>
      </footer>
    </div>
  );
}
