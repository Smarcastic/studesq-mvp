import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

async function deleteJSON(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export function useFriends() {
  return useQuery({
    queryKey: ["friends"],
    queryFn: () => fetchJSON("/api/friends"),
  });
}

export function useFriendRequests(type: "incoming" | "outgoing" = "incoming") {
  return useQuery({
    queryKey: ["friend-requests", type],
    queryFn: () => fetchJSON(`/api/friends/requests?type=${type}`),
    refetchInterval: 30000,
  });
}

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (addresseeId: string) =>
      postJSON("/api/friends/request", { addresseeId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friend-requests"] });
      qc.invalidateQueries({ queryKey: ["discover"] });
    },
  });
}

export function useRespondFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      friendshipId,
      action,
    }: {
      friendshipId: string;
      action: "accept" | "reject";
    }) => postJSON("/api/friends/respond", { friendshipId, action }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friend-requests"] });
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["social-unread"] });
    },
  });
}

export function useRemoveFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) =>
      deleteJSON("/api/friends/remove", { friendshipId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}
