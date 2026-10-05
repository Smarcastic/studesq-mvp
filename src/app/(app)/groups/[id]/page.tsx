"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { FadeUp } from "@/components/ui/motion";
import { useToast } from "@/components/ui/toast";
import {
  Users,
  MessageCircle,
  Copy,
  Globe,
  Lock,
  Crown,
  Shield,
  Megaphone,
} from "lucide-react";
import Link from "next/link";

interface GroupData {
  id: string;
  name: string;
  description: string | null;
  type: string;
  school: string | null;
  isPublic: boolean;
  inviteCode: string | null;
  conversationId: string | null;
  maxMembers: number;
  members: {
    id: string;
    role: string;
    joinedAt: string;
    user: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
  }[];
  announcements: {
    id: string;
    title: string;
    content: string;
    pinned: boolean;
    createdAt: string;
  }[];
  _count?: { members: number };
}

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { toast } = useToast();

  const { data: group, isLoading } = useQuery<GroupData>({
    queryKey: ["group", id],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${id}`);
      if (!res.ok) throw new Error("API error");
      return res.json();
    },
    enabled: !!id,
  });

  const copyInviteCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(
        `${window.location.origin}/groups/join/${group.inviteCode}`
      );
      toast("Invite link copied!");
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Group" />
        <Card className="p-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      </div>
    );
  }

  if (!group) {
    return (
      <div>
        <PageHeader title="Group not found" />
        <Card className="text-center py-12">
          <p style={{ color: "var(--text-muted)" }}>This group doesn't exist or you don't have access.</p>
        </Card>
      </div>
    );
  }

  const roleIcon = (role: string) => {
    if (role === "owner") return <Crown className="h-3 w-3 text-amber-500" />;
    if (role === "admin") return <Shield className="h-3 w-3 text-indigo-500" />;
    return null;
  };

  return (
    <div>
      <PageHeader
        title={group.name}
        action={
          <div className="flex gap-2">
            {group.conversationId && (
              <Link href={`/chat/${group.conversationId}`}>
                <Button size="sm">
                  <MessageCircle className="h-4 w-4" />
                  Group Chat
                </Button>
              </Link>
            )}
            {group.inviteCode && (
              <Button variant="outline" size="sm" onClick={copyInviteCode}>
                <Copy className="h-4 w-4" />
                Invite
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        {/* Info Card */}
        <FadeUp>
          <Card>
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {group.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2
                    className="text-xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {group.name}
                  </h2>
                  {group.isPublic ? (
                    <Globe className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Lock className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                  )}
                </div>
                {group.description && (
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    {group.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="secondary">{group.type}</Badge>
                  {group.school && (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {group.school}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    <Users className="h-3 w-3 inline mr-1" />
                    {group.members.length}/{group.maxMembers}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </FadeUp>

        {/* Announcements */}
        {group.announcements.length > 0 && (
          <FadeUp delay={0.05}>
            <Card>
              <CardTitle>
                <Megaphone className="h-5 w-5 text-amber-500 inline mr-2" />
                Announcements
              </CardTitle>
              <CardContent>
                <div className="space-y-3 mt-3">
                  {group.announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-3 rounded-xl border"
                      style={{
                        background: ann.pinned ? "var(--bg-elevated)" : "transparent",
                        borderColor: "var(--border-subtle)",
                      }}
                    >
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {ann.title}
                        {ann.pinned && (
                          <span className="text-[10px] text-amber-500 ml-2">PINNED</span>
                        )}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                        {ann.content}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeUp>
        )}

        {/* Members */}
        <FadeUp delay={0.1}>
          <Card>
            <CardTitle>Members ({group.members.length})</CardTitle>
            <CardContent>
              <div className="space-y-2 mt-3">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-xl"
                  >
                    <Avatar
                      src={member.user.image}
                      name={member.user.name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-sm font-medium truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {member.user.name}
                        </span>
                        {roleIcon(member.role)}
                      </div>
                      {member.user.username && (
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          @{member.user.username}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeUp>
      </div>
    </div>
  );
}
