"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { FadeUp, StaggerList, StaggerItem } from "@/components/ui/motion";
import { UserCard } from "@/components/social/UserCard";
import { StudentSearch } from "@/components/social/StudentSearch";
import { useSendFriendRequest } from "@/hooks/use-friends";
import { useCreateConversation } from "@/hooks/use-conversations";
import { useRouter } from "next/navigation";

interface DiscoveredUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  school: string | null;
  grade: string | null;
  bio: string | null;
  level: string;
  friendStatus?: "none" | "pending" | "friends";
}

export default function DiscoverPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const sendRequest = useSendFriendRequest();
  const createConv = useCreateConversation();

  const { data, isLoading } = useQuery<{ users: DiscoveredUser[] }>({
    queryKey: ["discover", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      const res = await fetch(`/api/discover?${params.toString()}`);
      if (!res.ok) throw new Error("API error");
      return res.json();
    },
  });

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
  }, []);

  return (
    <div>
      <PageHeader title="Discover Students" description="Find and connect with students" />

      <div className="space-y-6">
        <FadeUp>
          <StudentSearch onSearch={handleSearch} />
        </FadeUp>

        <FadeUp delay={0.05}>
          <Card>
            <CardTitle>
              {searchQuery
                ? `Results for "${searchQuery}"`
                : "Students You May Know"}
            </CardTitle>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3 mt-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : data?.users?.length ? (
                <StaggerList className="space-y-2 mt-3">
                  {data.users.map((user) => (
                    <StaggerItem key={user.id}>
                      <UserCard
                        user={user}
                        friendStatus={user.friendStatus || "none"}
                        onAddFriend={() => sendRequest.mutate(user.id)}
                        onMessage={async () => {
                          const conv = await createConv.mutateAsync({
                            type: "dm",
                            memberIds: [user.id],
                          });
                          router.push(`/chat/${conv.id}`);
                        }}
                        isLoading={sendRequest.isPending}
                      />
                    </StaggerItem>
                  ))}
                </StaggerList>
              ) : (
                <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
                  {searchQuery
                    ? "No students found. Try a different search."
                    : "No students to discover yet."}
                </p>
              )}
            </CardContent>
          </Card>
        </FadeUp>
      </div>
    </div>
  );
}
