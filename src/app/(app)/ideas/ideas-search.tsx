"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

type Props = {
  trendingTags: { tag: string; count: number }[];
};

export function IdeasSearch({ trendingTags }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeQuery = searchParams.get("q") ?? "";
  const activeTag = searchParams.get("tag") ?? "";

  const [draft, setDraft] = useState(activeQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync draft if URL changes externally
  useEffect(() => {
    setDraft(activeQuery);
  }, [activeQuery]);

  function navigate(q: string, tag: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tag) params.set("tag", tag);
    const qs = params.toString();
    router.push(`/ideas${qs ? `?${qs}` : ""}`);
  }

  function handleChange(value: string) {
    setDraft(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate(value, activeTag);
    }, 350);
  }

  function clearQuery() {
    setDraft("");
    navigate("", activeTag);
  }

  function clearTag() {
    navigate(activeQuery, "");
  }

  function selectTag(tag: string) {
    navigate(activeQuery, tag === activeTag ? "" : tag);
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search ideas by title or problem..."
          className="pl-9 pr-9"
        />
        {draft && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={clearQuery}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Active filters */}
      {activeTag && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filtered by:</span>
          <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={clearTag}>
            #{activeTag}
            <X className="h-3 w-3" />
          </Badge>
        </div>
      )}

      {/* Trending tags */}
      {trendingTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground shrink-0">Trending:</span>
          {trendingTags.map(({ tag }) => (
            <button
              key={tag}
              onClick={() => selectTag(tag)}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                activeTag === tag
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground border-border hover:border-foreground hover:text-foreground"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
