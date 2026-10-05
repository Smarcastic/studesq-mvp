"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { FadeUp } from "@/components/ui/motion";
import { ConversationList } from "@/components/chat/ConversationList";
import { useConversations } from "@/hooks/use-conversations";
import { MessageCircle, Plus, Search } from "lucide-react";
import Link from "next/link";

export default function ChatListPage() {
  const { data: session } = useSession();
  const { data: conversations, isLoading } = useConversations();
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? (conversations ?? []).filter((c: any) => {
        const name =
          c.type === "dm"
            ? c.members?.find((m: any) => m.userId !== session?.user?.id)?.user?.name ?? ""
            : c.name ?? "";
        return name.toLowerCase().includes(search.toLowerCase());
      })
    : conversations ?? [];

  return (
    <div>
      <PageHeader
        title="Chats"
        action={
          <Link href="/chat/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </Link>
        }
      />

      <FadeUp>
        <Card>
          <CardContent>
            {/* Search */}
            {!isLoading && (conversations?.length ?? 0) > 0 && (
              <div className="mb-3">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--bg-elevated)" }}
                >
                  <Search className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search conversations..."
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: "var(--text-primary)" }}
                  />
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <ConversationList conversations={filtered} />
            ) : search.trim() ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <Search className="h-8 w-8" style={{ color: "var(--text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No conversations matching &ldquo;{search}&rdquo;
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 gap-3">
                <MessageCircle
                  className="h-10 w-10"
                  style={{ color: "var(--text-muted)" }}
                />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No conversations yet
                </p>
                <Link href="/chat/new">
                  <Button variant="outline" size="sm">
                    Start a conversation
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeUp>
    </div>
  );
}
