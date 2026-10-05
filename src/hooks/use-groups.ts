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

export function useMyGroups() {
  return useQuery({
    queryKey: ["groups", "mine"],
    queryFn: () => fetchJSON("/api/groups?mine=true"),
  });
}

export function useDiscoverGroups(type?: string, school?: string) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (school) params.set("school", school);
  return useQuery({
    queryKey: ["groups", "discover", type, school],
    queryFn: () => fetchJSON(`/api/groups?${params.toString()}`),
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: ["group", id],
    queryFn: () => fetchJSON(`/api/groups/${id}`),
    enabled: !!id,
  });
}

export function useGroupMembers(id: string) {
  return useQuery({
    queryKey: ["group-members", id],
    queryFn: () => fetchJSON(`/api/groups/${id}/members`),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      type: string;
      school?: string;
      isPublic?: boolean;
    }) => postJSON("/api/groups", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) =>
      postJSON(`/api/groups/${groupId}/join`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useJoinGroupByCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      postJSON(`/api/groups/join/${code}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}
