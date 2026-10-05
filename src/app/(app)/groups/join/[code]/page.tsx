"use client";

import { use } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FadeUp } from "@/components/ui/motion";
import { useJoinGroupByCode } from "@/hooks/use-groups";
import { useRouter } from "next/navigation";
import { Users, Check } from "lucide-react";
import { useState } from "react";

export default function JoinGroupPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const joinGroup = useJoinGroupByCode();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    try {
      const result = await joinGroup.mutateAsync(code);
      setJoined(true);
      setTimeout(() => {
        router.push(`/groups/${result.id || result.groupId || ""}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join group");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <FadeUp>
        <Card className="max-w-sm w-full text-center p-8">
          {joined ? (
            <>
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-emerald-500" />
              </div>
              <h2
                className="text-lg font-bold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                You're in!
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Redirecting to the group...
              </p>
            </>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-indigo-500" />
              </div>
              <h2
                className="text-lg font-bold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Join Group
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                You've been invited to join a group on StudesQ
              </p>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                  {error}
                </div>
              )}
              <Button
                onClick={handleJoin}
                loading={joinGroup.isPending}
                className="w-full"
              >
                Join Group
              </Button>
            </>
          )}
        </Card>
      </FadeUp>
    </div>
  );
}
