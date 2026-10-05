"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { FadeUp } from "@/components/ui/motion";
import { Toggle } from "@/components/ui/toggle";
import { useCreateGroup } from "@/hooks/use-groups";
import { useRouter } from "next/navigation";

const GROUP_TYPES = [
  { value: "school", label: "School", emoji: "🏫" },
  { value: "class", label: "Class", emoji: "📚" },
  { value: "study", label: "Study Group", emoji: "📖" },
  { value: "custom", label: "Custom", emoji: "⭐" },
];

export default function NewGroupPage() {
  const router = useRouter();
  const createGroup = useCreateGroup();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("custom");
  const [school, setSchool] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const group = await createGroup.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        school: school.trim() || undefined,
        isPublic,
      });
      router.push(`/groups/${group.id}`);
    } catch {
      // handle error
    }
  };

  return (
    <div>
      <PageHeader title="Create Group" />

      <FadeUp>
        <Card className="max-w-lg mx-auto">
          <div className="space-y-5">
            <Input
              id="group-name"
              label="Group Name"
              placeholder="e.g. AP Chemistry Study Group"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Textarea
              id="group-desc"
              label="Description"
              placeholder="What is this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Group Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GROUP_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      type === t.value
                        ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                        : ""
                    }`}
                    style={
                      type !== t.value
                        ? {
                            borderColor: "var(--border-subtle)",
                            color: "var(--text-secondary)",
                          }
                        : undefined
                    }
                  >
                    <span className="text-lg mr-1">{t.emoji}</span> {t.label}
                  </button>
                ))}
              </div>
            </div>

            {(type === "school" || type === "class") && (
              <Input
                id="group-school"
                label="School Name"
                placeholder="e.g. Lincoln High School"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
              />
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Public Group
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Anyone can find and join this group
                </p>
              </div>
              <Toggle checked={isPublic} onChange={setIsPublic} />
            </div>

            <Button
              onClick={handleCreate}
              loading={createGroup.isPending}
              disabled={!name.trim()}
              className="w-full"
            >
              Create Group
            </Button>
          </div>
        </Card>
      </FadeUp>
    </div>
  );
}
