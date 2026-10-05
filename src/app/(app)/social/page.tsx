"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { FadeUp } from "@/components/ui/motion";
import { UserCard } from "@/components/social/UserCard";
import { FriendRequestCard } from "@/components/social/FriendRequestCard";
import { useFriends, useFriendRequests, useRespondFriendRequest } from "@/hooks/use-friends";
import { useSocialUnread } from "@/hooks/use-social-unread";
import { Users, UserPlus, Search, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreateConversation } from "@/hooks/use-conversations";

export default function SocialPage() {
  const router = useRouter();
  const { data: friends, isLoading: friendsLoading } = useFriends();
  const { data: requests, isLoading: requestsLoading } = useFriendRequests("incoming");
  const { data: unread } = useSocialUnread();
  const respond = useRespondFriendRequest();
  const createConv = useCreateConversation();

  const handleMessage = async (friendId: string) => {
    try {
      const conv = await createConv.mutateAsync({
        type: "dm",
        memberIds: [friendId],
      });
      router.push(`/chat/${conv.id}`);
    } catch {
      // conversation might already exist
    }
  };

  return (
    <div>
      <PageHeader
        title="Social"
        action={
          <div className="flex gap-2">
            <Link href="/social/discover">
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4" />
                Discover
              </Button>
            </Link>
            <Link href="/chat">
              <Button size="sm">
                <MessageCircle className="h-4 w-4" />
                Chats
                {unread?.unreadChats ? (
                  <span className="ml-1 bg-white/20 rounded-full px-1.5 text-[10px]">
                    {unread.unreadChats}
                  </span>
                ) : null}
              </Button>
            </Link>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Pending Requests */}
        {!requestsLoading && requests?.length > 0 && (
          <FadeUp>
            <Card>
              <CardTitle>
                <UserPlus className="h-5 w-5 text-cyan-500 inline mr-2" />
                Friend Requests ({requests.length})
              </CardTitle>
              <CardContent>
                <div className="space-y-2 mt-3">
                  {requests.slice(0, 3).map((req: { id: string; createdAt: string; requester: { id: string; name: string | null; username: string | null; image: string | null; school: string | null } }) => (
                    <FriendRequestCard
                      key={req.id}
                      request={{
                        id: req.id,
                        createdAt: req.createdAt,
                        user: req.requester,
                      }}
                      type="incoming"
                      onAccept={(id) =>
                        respond.mutate({ friendshipId: id, action: "accept" })
                      }
                      onReject={(id) =>
                        respond.mutate({ friendshipId: id, action: "reject" })
                      }
                      isLoading={respond.isPending}
                    />
                  ))}
                  {requests.length > 3 && (
                    <Link href="/social/friends?tab=requests">
                      <Button variant="ghost" size="sm" className="w-full">
                        View all {requests.length} requests
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </FadeUp>
        )}

        {/* Friends List */}
        <FadeUp delay={0.05}>
          <Card>
            <div className="flex items-center justify-between">
              <CardTitle>
                <Users className="h-5 w-5 text-indigo-500 inline mr-2" />
                Friends {friends?.length ? `(${friends.length})` : ""}
              </CardTitle>
              <Link href="/social/friends">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </div>
            <CardContent>
              {friendsLoading ? (
                <div className="space-y-3 mt-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : friends?.length > 0 ? (
                <div className="space-y-2 mt-3">
                  {friends.slice(0, 5).map((friend: { id: string; name: string | null; username: string | null; image: string | null; school: string | null; grade: string | null; bio: string | null; level?: string }) => (
                    <UserCard
                      key={friend.id}
                      user={friend}
                      friendStatus="friends"
                      onMessage={() => handleMessage(friend.id)}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className="flex flex-col items-center py-10 gap-3"
                >
                  <Users className="h-10 w-10" style={{ color: "var(--text-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    No friends yet. Discover students from your school!
                  </p>
                  <Link href="/social/discover">
                    <Button variant="outline" size="sm">
                      Find classmates
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeUp>

        {/* Quick Actions */}
        <FadeUp delay={0.1}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Find Friends", href: "/social/discover", icon: Search, color: "text-cyan-500" },
              { label: "Chat", href: "/chat", icon: MessageCircle, color: "text-indigo-500" },
              { label: "Groups", href: "/groups", icon: Users, color: "text-purple-500" },
              { label: "Requests", href: "/social/friends?tab=requests", icon: UserPlus, color: "text-amber-500" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:-translate-y-0.5"
                style={{
                  background: "var(--bg-elevated)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <action.icon className={`h-5 w-5 ${action.color}`} />
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </FadeUp>
      </div>
    </div>
  );
}
