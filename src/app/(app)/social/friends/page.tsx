"use client";

import { useState } from "react";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs } from "@/components/ui/tabs";
import { FadeUp } from "@/components/ui/motion";
import { UserCard } from "@/components/social/UserCard";
import { FriendRequestCard } from "@/components/social/FriendRequestCard";
import {
  useFriends,
  useFriendRequests,
  useRespondFriendRequest,
  useRemoveFriend,
} from "@/hooks/use-friends";
import { useCreateConversation } from "@/hooks/use-conversations";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FriendsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "requests" ? "requests" : "friends";
  const [tab, setTab] = useState(initialTab);

  const { data: friends, isLoading: friendsLoading } = useFriends();
  const { data: incoming } = useFriendRequests("incoming");
  const { data: outgoing } = useFriendRequests("outgoing");
  const respond = useRespondFriendRequest();
  const removeFriend = useRemoveFriend();
  const createConv = useCreateConversation();

  return (
    <div>
      <PageHeader title="Friends" />
      <div className="space-y-6">
        <FadeUp>
          <Tabs
            tabs={[
              { id: "friends", label: `Friends (${friends?.length || 0})` },
              { id: "requests", label: `Requests (${incoming?.length || 0})` },
              { id: "sent", label: `Sent (${outgoing?.length || 0})` },
            ]}
            activeTab={tab}
            onChange={setTab}
          />
        </FadeUp>

        <FadeUp delay={0.05}>
          {tab === "friends" && (
            <Card>
              <CardTitle>All Friends</CardTitle>
              <CardContent>
                {friendsLoading ? (
                  <div className="space-y-3 mt-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : friends?.length > 0 ? (
                  <div className="space-y-2 mt-3">
                    {friends.map((friend: { id: string; friendshipId: string; name: string | null; username: string | null; image: string | null; school: string | null; grade: string | null; bio: string | null }) => (
                      <UserCard
                        key={friend.id}
                        user={friend}
                        friendStatus="friends"
                        onMessage={async () => {
                          const conv = await createConv.mutateAsync({
                            type: "dm",
                            memberIds: [friend.id],
                          });
                          router.push(`/chat/${conv.id}`);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
                    No friends yet. Start by discovering students!
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {tab === "requests" && (
            <Card>
              <CardTitle>Incoming Requests</CardTitle>
              <CardContent>
                {incoming?.length > 0 ? (
                  <div className="space-y-2 mt-3">
                    {incoming.map((req: { id: string; createdAt: string; requester: { id: string; name: string | null; username: string | null; image: string | null; school: string | null } }) => (
                      <FriendRequestCard
                        key={req.id}
                        request={{ id: req.id, createdAt: req.createdAt, user: req.requester }}
                        type="incoming"
                        onAccept={(id) => respond.mutate({ friendshipId: id, action: "accept" })}
                        onReject={(id) => respond.mutate({ friendshipId: id, action: "reject" })}
                        isLoading={respond.isPending}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
                    No pending requests
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {tab === "sent" && (
            <Card>
              <CardTitle>Sent Requests</CardTitle>
              <CardContent>
                {outgoing?.length > 0 ? (
                  <div className="space-y-2 mt-3">
                    {outgoing.map((req: { id: string; createdAt: string; addressee: { id: string; name: string | null; username: string | null; image: string | null; school: string | null } }) => (
                      <FriendRequestCard
                        key={req.id}
                        request={{ id: req.id, createdAt: req.createdAt, user: req.addressee }}
                        type="outgoing"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
                    No sent requests
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </FadeUp>
      </div>
    </div>
  );
}

export default function FriendsPage() {
  return (
    <Suspense>
      <FriendsContent />
    </Suspense>
  );
}
