"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UsernameSetup } from "@/components/social/UsernameSetup";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"student" | "parent">("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, username: username || undefined }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    // Auto sign in after registration
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!result?.error) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError("Account created but failed to sign in. Please try logging in.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-400/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-bold">
              Studes<span className="text-primary-500">Q</span>
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Create your account
          </p>
        </div>

        <Card className="p-8" glass={false}>
          <h2 className="text-xl font-semibold mb-6">Sign up</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="name"
              label="Full name"
              placeholder="Alex Chen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <UsernameSetup value={username} onChange={setUsername} />
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              id="confirmPassword"
              label="Confirm password"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                I am a...
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                    role === "student"
                      ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400"
                      : "border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole("parent")}
                  className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                    role === "parent"
                      ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400"
                      : "border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  Parent
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
