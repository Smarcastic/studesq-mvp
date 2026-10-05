"use client";

import { useState } from "react";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { FadeUp } from "@/components/ui/motion";
import { Avatar } from "@/components/ui/avatar";
import { useFriends } from "@/hooks/use-friends";
import { useCreateConversation } from "@/hooks/use-conversations";
import { useRouter } from "next/navigation";
import { Check, MessageCircle, Users } from "lucide-react";

export default function NewChatPage() {
  const router = useRouter();
  const { data: friends } = useFriends();
  const createConv = useCreateConversation();
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [filter, setFilter] = useState("");

  const isGroup = selected.length > 1;

  const filtered = (friends || []).filter(
    (f: { name: string | null; username: string | null }) =>
      !filter ||
      f.name?.toLowerCase().includes(filter.toLowerCase()) ||
      f.username?.toLowerCase().includes(filter.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (selected.length === 0) return;
    try {
      const conv = await createConv.mutateAsync({
        type: isGroup ? "group" : "dm",
        memberIds: selected,
        name: isGroup ? groupName || "Group Chat" : undefined,
      });
      router.push(`/chat/${conv.id}`);
    } catch {
      // handle error
    }
  };

  return (
    <div>
      <PageHeader title="New Conversation" />

      <div className="space-y-6">
        <FadeUp>
          <Card>
            <CardTitle>Select Friends</CardTitle>
            <CardContent>
              <Input
                id="friend-filter"
                placeholder="Search friends..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="mb-4"
              />

              {isGroup && (
                <Input
                  id="group-name"
                  label="Group Name"
                  placeholder="Name your group chat..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="mb-4"
                />
              )}

              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {filtered.map(
                  (friend: {
                    id: string;
                    name: string | null;
                    username: string | null;
                    image: string | null;
                  }) => {
                    const isSelected = selected.includes(friend.id);
                    return (
                      <button
                        key={friend.id}
                        onClick={() => toggleSelect(friend.id)}
                        className="flex items-center gap-3 w-full p-3 rounded-xl transition-colors text-left"
                        style={{
                          background: isSelected
                            ? "var(--accent-glow, rgba(6, 182, 212, 0.1))"
                            : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected)
                            e.currentTarget.style.background = "var(--bg-elevated)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected)
                            e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <Avatar
                          src={friend.image}
                          name={friend.name}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {friend.name}
                          </p>
                          {friend.username && (
                            <p
                              className="text-xs truncate"
                              style={{ color: "var(--text-muted)" }}
                            >
                              @{friend.username}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="h-5 w-5 rounded-full bg-cyan-500 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  }
                )}
                {filtered.length === 0 && (
                  <p
                    className="text-sm py-8 text-center"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {friends?.length
                      ? "No friends match your search"
                      : "Add friends first to start chatting"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </FadeUp>

        {selected.length > 0 && (
          <FadeUp delay={0.05}>
            <Button
              onClick={handleCreate}
              loading={createConv.isPending}
              className="w-full"
            >
              {isGroup ? (
                <>
                  <Users className="h-4 w-4" />
                  Create Group Chat ({selected.length} members)
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4" />
                  Start Conversation
                </>
              )}
            </Button>
          </FadeUp>
        )}
      </div>
    </div>
  );
}
