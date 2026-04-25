import { notificationRepository, type Notification } from "../repositories/notification.repository";
import { sendEmail } from "@/lib/email/resend";
import { userRepository } from "@/modules/user/repositories/user.repository";
import { logger } from "@/lib/telemetry/logger";

export class NotificationService {
  async create(data: {
    userId: string;
    kind: string;
    payload: Record<string, unknown>;
  }): Promise<Notification> {
    return notificationRepository.create(data);
  }

  async sendAndSave(data: {
    userId: string;
    kind: string;
    payload: Record<string, unknown>;
    emailSubject?: string;
    emailHtml?: string;
  }): Promise<Notification> {
    const notification = await notificationRepository.create({
      userId: data.userId,
      kind: data.kind,
      payload: data.payload,
    });

    // Send email if provided
    if (data.emailSubject && data.emailHtml) {
      const user = await userRepository.findById(data.userId);
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: data.emailSubject,
          html: data.emailHtml,
        });
      }
    }

    return notification;
  }

  async getUnread(userId: string): Promise<Notification[]> {
    return notificationRepository.listUnread(userId);
  }

  async getAll(userId: string): Promise<Notification[]> {
    return notificationRepository.listAll(userId);
  }

  async markRead(id: string, userId: string): Promise<void> {
    return notificationRepository.markRead(id, userId);
  }

  async markAllRead(userId: string): Promise<void> {
    return notificationRepository.markAllRead(userId);
  }
}

export const notificationService = new NotificationService();
