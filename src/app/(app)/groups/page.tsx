"use client";

import { useState } from "react";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs } from "@/components/ui/tabs";
import { FadeUp } from "@/components/ui/motion";
import { GroupCard } from "@/components/groups/GroupCard";
import { useMyGroups, useDiscoverGroups, useJoinGroup } from "@/hooks/use-groups";
import { Plus, Users } from "lucide-react";
import Link from "next/link";

export default function GroupsPage() {
  const [tab, setTab] = useState("my");
  const { data: myGroups, isLoading: myLoading } = useMyGroups();
  const { data: publicGroups, isLoading: pubLoading } = useDiscoverGroups();
  const joinGroup = useJoinGroup();

  return (
    <div>
      <PageHeader
        title="Groups"
        action={
          <Link href="/groups/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Create Group
            </Button>
          </Link>
        }
      />

      <div className="space-y-6">
        <FadeUp>
          <Tabs
            tabs={[
              { id: "my", label: `My Groups (${myGroups?.length || 0})` },
              { id: "discover", label: "Discover" },
            ]}
            activeTab={tab}
            onChange={setTab}
          />
        </FadeUp>

        <FadeUp delay={0.05}>
          {tab === "my" && (
            <div className="space-y-3">
              {myLoading ? (
                [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)
              ) : myGroups?.length > 0 ? (
                myGroups.map((group: { id: string; name: string; description: string | null; type: string; school: string | null; isPublic: boolean; avatarUrl: string | null; _count?: { members: number } }) => (
                  <GroupCard key={group.id} group={group} isMember />
                ))
              ) : (
                <Card>
                  <CardContent>
                    <div className="flex flex-col items-center py-10 gap-3">
                      <Users className="h-10 w-10" style={{ color: "var(--text-muted)" }} />
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        You haven't joined any groups yet
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setTab("discover")}>
                          Browse Groups
                        </Button>
                        <Link href="/groups/new">
                          <Button size="sm">Create Group</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {tab === "discover" && (
            <div className="space-y-3">
              {pubLoading ? (
                [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)
              ) : publicGroups?.length > 0 ? (
                publicGroups.map((group: { id: string; name: string; description: string | null; type: string; school: string | null; isPublic: boolean; avatarUrl: string | null; _count?: { members: number } }) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onJoin={() => joinGroup.mutate(group.id)}
                    isLoading={joinGroup.isPending}
                  />
                ))
              ) : (
                <Card>
                  <CardContent>
                    <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
                      No public groups available
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </FadeUp>
      </div>
    </div>
  );
}
