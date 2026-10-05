import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";

async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

async function postJSON(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => fetchJSON("/api/conversations"),
    refetchInterval: 10000,
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ["conversation", id],
    queryFn: () => fetchJSON(`/api/conversations/${id}`),
    enabled: !!id,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }): Promise<{ messages: Record<string, unknown>[]; nextCursor: string | null }> => {
      const url = `/api/conversations/${conversationId}/messages${
        pageParam ? `?cursor=${pageParam}` : ""
      }`;
      return fetchJSON(url);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!conversationId,
  });
}

export function useMessagePoll(conversationId: string, since: string | null) {
  return useQuery({
    queryKey: ["message-poll", conversationId, since],
    queryFn: () =>
      fetchJSON(
        `/api/conversations/${conversationId}/poll?since=${encodeURIComponent(since || new Date().toISOString())}`
      ),
    enabled: !!conversationId && !!since,
    refetchInterval: 3000,
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      content?: string;
      type?: string;
      metadata?: string;
      replyToId?: string;
    }) => postJSON(`/api/conversations/${conversationId}/messages`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      type: "dm" | "group";
      memberIds: string[];
      name?: string;
    }) => postJSON("/api/conversations", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMarkRead(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      postJSON(`/api/conversations/${conversationId}/read`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["social-unread"] });
    },
  });
}

export function useToggleReaction(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ msgId, emoji }: { msgId: string; emoji: string }) =>
      postJSON(
        `/api/conversations/${conversationId}/messages/${msgId}/reactions`,
        { emoji }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}

export function useSendTyping(conversationId: string) {
  return useMutation({
    mutationFn: () =>
      postJSON(`/api/conversations/${conversationId}/typing`, {}),
  });
}

export function usePollVote(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { messageId: string; optionIndex: number }) =>
      postJSON(`/api/conversations/${conversationId}/poll-vote`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}
