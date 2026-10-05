import { useQuery } from "@tanstack/react-query";

interface SocialUnread {
  pendingRequests: number;
  unreadChats: number;
}

export function useSocialUnread() {
  return useQuery<SocialUnread>({
    queryKey: ["social-unread"],
    queryFn: async () => {
      const res = await fetch("/api/social/unread");
      if (!res.ok) return { pendingRequests: 0, unreadChats: 0 };
      return res.json();
    },
    refetchInterval: 15000,
  });
}
