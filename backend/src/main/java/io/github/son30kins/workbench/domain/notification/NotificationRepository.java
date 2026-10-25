package io.github.son30kins.workbench.domain.notification;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Port lưu trữ thông báo trong app. */
public interface NotificationRepository {

	Notification save(Notification notification);

	List<Notification> findRecent(UUID userId, int limit);

	long countUnread(UUID userId);

	void markAllRead(UUID userId, Instant now);

}
