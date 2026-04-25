"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { startExecutionModeAction } from "@/modules/execution/_actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Rocket } from "lucide-react";

interface Props {
  productId: string;
  buildRoomId: string;
}

export function StartExecutionButton({ productId, buildRoomId }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStart = async () => {
    setIsLoading(true);
    const res = await startExecutionModeAction(productId, buildRoomId);
    if (res.ok) {
      toast({
        title: "Execution Mode Started!",
        description: "AI has generated your initial roadmap and tasks.",
      });
    } else {
      toast({
        title: "Failed to start",
        description: res.message || "An error occurred.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleStart} disabled={isLoading} className="gap-2">
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
      Start Execution Mode
    </Button>
  );
}
