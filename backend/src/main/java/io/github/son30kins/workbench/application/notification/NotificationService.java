package io.github.son30kins.workbench.application.notification;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.domain.notification.Notification;
import io.github.son30kins.workbench.domain.notification.NotificationRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Thông báo trong app (chuông trên header). */
@Service
@Transactional
@RequiredArgsConstructor
public class NotificationService {

	private static final int INBOX_SIZE = 15;

	private final NotificationRepository notifications;

	private final Clock clock;

	public record Inbox(List<Notification> items, long unread) {
	}

	public void add(UUID userId, UUID taskId, String title, String body) {
		notifications.save(new Notification(userId, taskId, title, body));
	}

	@Transactional(readOnly = true)
	public Inbox inbox(UUID userId) {
		return new Inbox(notifications.findRecent(userId, INBOX_SIZE), notifications.countUnread(userId));
	}

	public void markAllRead(UUID userId) {
		notifications.markAllRead(userId, clock.instant());
	}

}
