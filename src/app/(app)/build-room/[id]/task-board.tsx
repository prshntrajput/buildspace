"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createTaskAction, completeTaskAction, moveTaskAction } from "@/modules/build-room/_actions";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Task } from "@/modules/build-room/types";
import { Plus, CheckCircle, Clock, CircleDot, Link as LinkIcon, Wifi, WifiOff } from "lucide-react";

type TaskStatus = Task["status"];

const COLUMNS: { status: TaskStatus; label: string; icon: React.ReactNode }[] = [
  { status: "todo", label: "To Do", icon: <CircleDot className="h-4 w-4 text-muted-foreground" /> },
  { status: "in_progress", label: "In Progress", icon: <Clock className="h-4 w-4 text-yellow-500" /> },
  { status: "done", label: "Done", icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
];

type Props = {
  buildRoomId: string;
  initialTasks: Task[];
  canEdit: boolean;
};

function mapRealtimeRow(row: Record<string, unknown>): Task {
  return {
    id: String(row["id"] ?? ""),
    buildRoomId: String(row["build_room_id"] ?? ""),
    title: String(row["title"] ?? ""),
    description: row["description"] != null ? String(row["description"]) : null,
    status: (row["status"] as TaskStatus) ?? "todo",
    assigneeId: row["assignee_id"] != null ? String(row["assignee_id"]) : null,
    dueDate: row["due_date"] != null ? new Date(String(row["due_date"])) : null,
    estimateMinutes: row["estimate_minutes"] != null ? Number(row["estimate_minutes"]) : null,
    proofUrl: row["proof_url"] != null ? String(row["proof_url"]) : null,
    milestoneId: row["milestone_id"] != null ? String(row["milestone_id"]) : null,
    weight: Number(row["weight"] ?? 1),
    completedAt: row["completed_at"] != null ? new Date(String(row["completed_at"])) : null,
    createdById: row["created_by_id"] != null ? String(row["created_by_id"]) : null,
    createdAt: new Date(String(row["created_at"] ?? Date.now())),
    updatedAt: new Date(String(row["updated_at"] ?? Date.now())),
  };
}

export function TaskBoard({ buildRoomId, initialTasks, canEdit }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [connected, setConnected] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [completeTaskId, setCompleteTaskId] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [taskError, setTaskError] = useState<string | null>(null);

  // Keep a ref so the realtime callback always has the latest tasks
  const tasksRef = useRef(tasks);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`tasks:${buildRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `build_room_id=eq.${buildRoomId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const { eventType, new: newRow, old: oldRow } = payload;
          if (eventType === "INSERT" && newRow) {
            const task = mapRealtimeRow(newRow as Record<string, unknown>);
            setTasks((prev) =>
              prev.some((t) => t.id === task.id) ? prev : [...prev, task]
            );
          } else if (eventType === "UPDATE" && newRow) {
            const task = mapRealtimeRow(newRow as Record<string, unknown>);
            setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
          } else if (eventType === "DELETE" && oldRow) {
            const id = String((oldRow as Record<string, unknown>)["id"] ?? "");
            setTasks((prev) => prev.filter((t) => t.id !== id));
          }
        }
      )
      .subscribe((status: string) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [buildRoomId]);

  function byStatus(status: TaskStatus) {
    return tasks.filter((t) => t.status === status);
  }

  function handleCreate() {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      const result = await createTaskAction({
        buildRoomId,
        title: newTitle.trim(),
        ...(newDescription ? { description: newDescription } : {}),
        weight: 1,
      });
      if (result.ok) {
        // Optimistic — realtime will confirm
        setTasks((prev) =>
          prev.some((t) => t.id === result.data.id) ? prev : [...prev, result.data]
        );
        setNewTitle("");
        setNewDescription("");
        setShowCreate(false);
      }
    });
  }

  function handleMove(taskId: string, newStatus: TaskStatus) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (newStatus === "done" && !task.proofUrl) {
      setCompleteTaskId(taskId);
      return;
    }

    startTransition(async () => {
      const result = await moveTaskAction(taskId, { status: newStatus });
      if (result.ok) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? result.data : t)));
      }
    });
  }

  function handleCompleteWithProof() {
    if (!completeTaskId || !proofUrl.trim()) return;
    setTaskError(null);
    startTransition(async () => {
      const result = await completeTaskAction(completeTaskId, { proofUrl: proofUrl.trim() });
      if (result.ok) {
        setTasks((prev) => prev.map((t) => (t.id === completeTaskId ? result.data : t)));
        setCompleteTaskId(null);
        setProofUrl("");
      } else {
        setTaskError(result.message ?? "Failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {connected ? (
            <><Wifi className="h-3 w-3 text-green-500" /> Live</>
          ) : (
            <><WifiOff className="h-3 w-3" /> Connecting…</>
          )}
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.status} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              {col.icon}
              <span className="text-sm font-medium">{col.label}</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {byStatus(col.status).length}
              </Badge>
            </div>
            <div className="space-y-2 min-h-[120px]">
              {byStatus(col.status).map((task) => (
                <Card key={task.id} className="border-border/50">
                  <CardContent className="py-3 px-3 space-y-2">
                    <p className="text-sm font-medium leading-tight">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                    )}
                    {task.proofUrl && (
                      <a
                        href={task.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <LinkIcon className="h-3 w-3" />
                        Proof
                      </a>
                    )}
                    {canEdit && col.status !== "done" && col.status !== "cancelled" && (
                      <div className="flex gap-1 pt-1">
                        {col.status === "todo" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => handleMove(task.id, "in_progress")}
                            disabled={isPending}
                          >
                            Start
                          </Button>
                        )}
                        {col.status === "in_progress" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => handleMove(task.id, "done")}
                            disabled={isPending}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What needs to be done?"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-desc">Description (optional)</Label>
              <Input
                id="task-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="More details..."
                maxLength={1000}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isPending || !newTitle.trim()}>
                {isPending ? "Creating..." : "Add Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete with Proof Dialog */}
      <Dialog
        open={!!completeTaskId}
        onOpenChange={() => { setCompleteTaskId(null); setProofUrl(""); setTaskError(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach Proof to Complete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A proof link is required — a GitHub PR, Loom video, screenshot URL, or anything that shows the work was done.
            </p>
            {taskError && <div className="text-sm text-destructive">{taskError}</div>}
            <div className="space-y-2">
              <Label htmlFor="proof-url">Proof URL</Label>
              <Input
                id="proof-url"
                type="url"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://github.com/..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setCompleteTaskId(null); setProofUrl(""); }}>Cancel</Button>
              <Button onClick={handleCompleteWithProof} disabled={isPending || !proofUrl.trim()}>
                {isPending ? "Completing..." : "Mark Done"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
