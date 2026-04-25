import { z } from "zod";

export const TeamRoleCreateInput = z.object({
  teamId: z.string().uuid(),
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  requiredSkills: z.array(z.string()).max(10).default([]),
});

export const ApplicationSubmitInput = z.object({
  teamRoleId: z.string().uuid(),
  coverNote: z.string().min(50).max(2000),
  links: z.array(z.string().url()).max(5).default([]),
});

export const ApplicationDecideInput = z.object({
  decision: z.enum(["accepted", "rejected"]),
});

export type TeamRoleCreateInputType = z.infer<typeof TeamRoleCreateInput>;
export type ApplicationSubmitInputType = z.infer<typeof ApplicationSubmitInput>;
export type ApplicationDecideInputType = z.infer<typeof ApplicationDecideInput>;
