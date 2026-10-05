"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        setError("Too many requests. Please try again later.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-400/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-bold">
              Studes<span className="text-primary-500">Q</span>
            </span>
          </div>
        </div>

        <Card className="p-8" glass={false}>
          {sent ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 mx-auto">
                <Mail className="h-6 w-6 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold">Check your email</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                If an account exists with <strong>{email}</strong>, you&apos;ll receive password reset instructions.
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                In development mode, check your terminal console for the reset link.
              </p>
              <Link href="/login">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="h-4 w-4" /> Back to login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-2">Forgot your password?</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  id="email"
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" loading={loading}>
                  Send Reset Link
                </Button>
              </form>

              <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
