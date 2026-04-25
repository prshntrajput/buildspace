import { userRepository } from "../repositories/user.repository";
import type { User, PublicUser } from "../types";
import type { UserUpdateInputType } from "../schemas";
import { NotFoundError, ConflictError } from "@/lib/errors";
import { sendEvent } from "@/inngest/send";
import { invalidate } from "@/lib/cache";

export class UserService {
  async getPublicProfile(handle: string): Promise<PublicUser> {
    const user = await userRepository.findByHandle(handle);
    if (!user) throw new NotFoundError("User");
    return user;
  }

  async getById(id: string): Promise<User> {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User");
    return user;
  }

  async updateProfile(userId: string, input: UserUpdateInputType): Promise<User> {
    const user = await userRepository.update(userId, {
      displayName: input.displayName,
      bio: input.bio,
      skills: input.skills,
      availability: input.availability,
      timezone: input.timezone,
      websiteUrl: input.websiteUrl ?? null,
      xUsername: input.xUsername ?? null,
      linkedinUrl: input.linkedinUrl ?? null,
      avatarUrl: input.avatarUrl,
    });
    await invalidate(`profile:${user.handle}`);
    return user;
  }

  async setOnboardingRole(userId: string, roles: string[]): Promise<User> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User");
    const onboardingState = { ...user.onboardingState, role_selected: true, roles };
    return userRepository.update(userId, { onboardingState });
  }

  async setOnboardingSkills(
    userId: string,
    skills: string[],
    availability: string,
    timezone: string
  ): Promise<User> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User");
    const onboardingState = { ...user.onboardingState, skills_added: true };
    return userRepository.update(userId, {
      skills,
      availability: availability as User["availability"],
      timezone,
      onboardingState,
    });
  }

  async completeOnboarding(userId: string, goal: string): Promise<User> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User");
    const onboardingState = { ...user.onboardingState, goal_set: true };
    const updated = await userRepository.update(userId, { goal, onboardingState });
    await sendEvent({ name: "user/onboarded", data: { userId } });
    return updated;
  }

  async ensureUser(data: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  }): Promise<User> {
    const handle = await this.generateUniqueHandle(data.email, data.name);
    return userRepository.upsert({
      id: data.id,
      email: data.email,
      handle,
      displayName: data.name ?? "",
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
    });
  }

  async generateUniqueHandle(email: string, name?: string): Promise<string> {
    const base = name
      ? name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15)
      : email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15) ?? "user";

    const handle = base || "user";

    // Check uniqueness
    const existing = await userRepository.findByHandle(handle);
    if (!existing) return handle;

    // Append random suffix
    const suffix = Math.floor(Math.random() * 9000 + 1000).toString();
    return `${handle}${suffix}`;
  }

  isOnboardingComplete(user: User): boolean {
    const { onboardingState } = user;
    return (
      onboardingState.role_selected &&
      onboardingState.skills_added &&
      onboardingState.goal_set
    );
  }

  getOnboardingStep(user: User): "role" | "skills" | "goal" | "complete" {
    const { onboardingState } = user;
    if (!onboardingState.role_selected) return "role";
    if (!onboardingState.skills_added) return "skills";
    if (!onboardingState.goal_set) return "goal";
    return "complete";
  }
}

export const userService = new UserService();
