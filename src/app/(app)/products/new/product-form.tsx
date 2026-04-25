"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProductAction } from "@/modules/product/_actions";
import { X, Plus } from "lucide-react";

export function ProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ideaId = searchParams.get("ideaId");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");

  function addTech() {
    const t = techInput.trim();
    if (t && !techStack.includes(t) && techStack.length < 15) {
      setTechStack([...techStack, t]);
      setTechInput("");
    }
  }

  function removeTech(tech: string) {
    setTechStack(techStack.filter((t) => t !== tech));
  }

  function handleTechKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTech();
    }
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createProductAction({
        name,
        description: description || undefined,
        ideaId: ideaId ?? undefined,
        techStack,
        repoUrl: repoUrl || undefined,
        demoUrl: demoUrl || undefined,
        visibility,
      });

      if (!result.ok) {
        setError(result.message ?? "Something went wrong");
        return;
      }

      router.push(`/build-room/${result.data.buildRoom.id}`);
    });
  }

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {ideaId && (
        <div className="rounded-md bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-primary">
          Creating product from your idea. The idea will be linked automatically.
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">
          Product Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. BuildSpace, DevPulse, ShipFast"
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Short Description (optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="One or two sentences about what this product does"
          rows={2}
          maxLength={500}
        />
      </div>

      <div className="space-y-2">
        <Label>Tech Stack (optional)</Label>
        <div className="flex gap-2">
          <Input
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={handleTechKeyDown}
            placeholder="e.g. Next.js, Supabase, Drizzle"
            maxLength={30}
            disabled={techStack.length >= 15}
          />
          <Button type="button" variant="outline" size="sm" onClick={addTech} disabled={techStack.length >= 15}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {techStack.map((tech) => (
              <Badge key={tech} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeTech(tech)}>
                {tech}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="repoUrl">Repository URL (optional)</Label>
          <Input
            id="repoUrl"
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/you/repo"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="demoUrl">Demo URL (optional)</Label>
          <Input
            id="demoUrl"
            type="url"
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            placeholder="https://yourapp.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Visibility</Label>
        <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="unlisted">Unlisted</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Creating..." : "Start Building"}
        </Button>
      </div>
    </form>
  );
}
