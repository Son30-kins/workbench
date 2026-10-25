package io.github.son30kins.workbench.infrastructure.persistence;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.domain.notification.Notification;
import io.github.son30kins.workbench.domain.notification.NotificationRepository;

import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
class NotificationRepositoryAdapter implements NotificationRepository {

	private final NotificationSpringDataRepository jpa;

	@Override
	public Notification save(Notification notification) {
		return jpa.save(notification);
	}

	@Override
	public List<Notification> findRecent(UUID userId, int limit) {
		return jpa.findByUserIdOrderByCreatedAtDesc(userId, Limit.of(limit));
	}

	@Override
	public long countUnread(UUID userId) {
		return jpa.countByUserIdAndReadAtIsNull(userId);
	}

	@Override
	public void markAllRead(UUID userId, Instant now) {
		jpa.markAllRead(userId, now);
	}

}
