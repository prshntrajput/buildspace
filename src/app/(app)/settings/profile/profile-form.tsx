"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProfileAction } from "@/modules/user/_actions";
import type { User } from "@/modules/user/types";
import { X, Plus } from "lucide-react";

type Props = { user: User };

export function ProfileForm({ user }: Props) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio ?? "");
  const [timezone, setTimezone] = useState(user.timezone);
  const [availability, setAvailability] = useState(user.availability);
  const [websiteUrl, setWebsiteUrl] = useState(user.websiteUrl ?? "");
  const [xUsername, setXUsername] = useState(user.xUsername ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(user.linkedinUrl ?? "");
  const [skills, setSkills] = useState<string[]>(user.skills);
  const [skillInput, setSkillInput] = useState("");

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s) && skills.length < 30) {
      setSkills([...skills, s]);
      setSkillInput("");
    }
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
  }

  function handleSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    }
  }

  function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateProfileAction({
        displayName,
        bio: bio || undefined,
        skills,
        availability,
        timezone,
        websiteUrl: websiteUrl || undefined,
        xUsername: xUsername || undefined,
        linkedinUrl: linkedinUrl || undefined,
      });

      if (result.ok) {
        setSuccess(true);
      } else {
        setError(result.message ?? "Failed to save");
      }
    });
  }

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      {success && (
        <div className="rounded-md bg-green-500/10 border border-green-500/30 px-4 py-3 text-sm text-green-600">
          Profile saved successfully.
        </div>
      )}
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={60}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell the world what you're building..."
          rows={3}
          maxLength={500}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Availability</Label>
          <Select value={availability} onValueChange={(v) => setAvailability(v as User["availability"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Full-time</SelectItem>
              <SelectItem value="part_time">Part-time</SelectItem>
              <SelectItem value="weekends">Weekends only</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="e.g. Asia/Kolkata"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Skills</Label>
        <div className="flex gap-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            placeholder="Add a skill..."
            maxLength={40}
            disabled={skills.length >= 30}
          />
          <Button type="button" variant="outline" size="sm" onClick={addSkill} disabled={skills.length >= 30}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {skills.map((s) => (
              <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeSkill(s)}>
                {s}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Social Links</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="website">Website</Label>
            <Input id="website" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://yoursite.com" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="twitter">X / Twitter username</Label>
            <Input id="twitter" value={xUsername} onChange={(e) => setXUsername(e.target.value)} placeholder="yourhandle" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <Input id="linkedin" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/you" />
          </div>
        </div>
      </div>

      <Button type="button" onClick={handleSave} disabled={isPending}>
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
