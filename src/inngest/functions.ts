import { onIdeaCreated } from "@/modules/idea/events/idea-created";
import { embedIdea } from "@/modules/idea/events/embed-idea";
import {
  onScoreRecompute,
  dailyScoreRecompute,
  onTaskCompleted,
} from "@/modules/execution/events/score-recompute";
import { inactivitySweep } from "@/modules/product/events/inactivity-sweep";
import {
  onApplicationSubmitted,
  onApplicationDecided,
  onMemberJoined,
  onUpdatePostedNotify,
  onTaskCompletedNotify,
} from "@/modules/notification/events/notification-fanout";
import { weeklyDigest } from "@/modules/notification/events/weekly-digest";

export const functions = [
  onIdeaCreated,
  embedIdea,
  onScoreRecompute,
  dailyScoreRecompute,
  onTaskCompleted,
  inactivitySweep,
  onApplicationSubmitted,
  onApplicationDecided,
  onMemberJoined,
  onUpdatePostedNotify,
  onTaskCompletedNotify,
  weeklyDigest,
];
