"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/ui/toast";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";
import { parseJsonArray } from "@/lib/utils";
import { useState } from "react";
import { X } from "lucide-react";

export default function EditProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetch("/api/profile").then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); }),
  });

  const mutation = useMutation({
    mutationFn: (data: ProfileInput) =>
      fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update profile");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast("Profile updated successfully");
      router.push("/profile");
    },
    onError: () => {
      toast("Failed to update profile", "error");
    },
  });

  if (isLoading) return null;

  return (
    <EditProfileForm
      defaultValues={{
        name: profile?.name || "",
        bio: profile?.bio || "",
        school: profile?.school || "",
        grade: profile?.grade || "",
        graduationYear: profile?.graduationYear || undefined,
        location: profile?.location || "",
        interests: parseJsonArray(profile?.interests),
        careerAspirations: profile?.careerAspirations || "",
        languages: parseJsonArray(profile?.languages),
        skills: parseJsonArray(profile?.skills),
        academicGoals: profile?.academicGoals || "",
      }}
      onSubmit={(data) => mutation.mutate(data)}
      saving={mutation.isPending}
    />
  );
}

function EditProfileForm({
  defaultValues,
  onSubmit,
  saving,
}: {
  defaultValues: ProfileInput;
  onSubmit: (data: ProfileInput) => void;
  saving: boolean;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const interests = watch("interests") || [];
  const languages = watch("languages") || [];
  const skills = watch("skills") || [];

  return (
    <div>
      <PageHeader title="Edit Profile" description="Update your personal information." />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <Card>
          <h3 className="font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <Input id="name" label="Full Name" {...register("name")} error={errors.name?.message} />
            <Textarea id="bio" label="Bio" placeholder="Tell us about yourself..." {...register("bio")} error={errors.bio?.message} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input id="school" label="School" placeholder="Lincoln High School" {...register("school")} />
              <Input id="grade" label="Grade" placeholder="11th Grade" {...register("grade")} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input id="location" label="Location" placeholder="City, Country" {...register("location")} />
              <Input id="graduationYear" label="Graduation Year" type="number" placeholder="2026" {...register("graduationYear", { valueAsNumber: true })} />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Interests & Skills</h3>
          <div className="space-y-4">
            <TagInput label="Interests" tags={interests} onChange={(tags) => setValue("interests", tags)} placeholder="Type and press Enter..." />
            <TagInput label="Skills" tags={skills} onChange={(tags) => setValue("skills", tags)} placeholder="Type and press Enter..." />
            <TagInput label="Languages" tags={languages} onChange={(tags) => setValue("languages", tags)} placeholder="Type and press Enter..." />
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Goals & Aspirations</h3>
          <div className="space-y-4">
            <Textarea id="careerAspirations" label="Career Aspirations" placeholder="What career paths interest you?" {...register("careerAspirations")} />
            <Textarea id="academicGoals" label="Academic Goals" placeholder="What are your academic goals?" {...register("academicGoals")} />
          </div>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" loading={saving}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
}

function TagInput({ label, tags, onChange, placeholder }: { label: string; tags: string[]; onChange: (tags: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput("");
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} className="hover:text-primary-900 dark:hover:text-primary-100">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
        placeholder={placeholder}
        className="flex h-10 w-full rounded-lg border-2 bg-white dark:bg-dark-surface px-3 py-2 text-sm border-gray-300 dark:border-dark-border placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
      />
    </div>
  );
}
