package io.github.son30kins.workbench.infrastructure.persistence;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import io.github.son30kins.workbench.domain.notification.Notification;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface NotificationSpringDataRepository extends JpaRepository<Notification, UUID> {

	List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Limit limit);

	long countByUserIdAndReadAtIsNull(UUID userId);

	@Modifying
	@Query("update Notification n set n.readAt = :now where n.userId = :userId and n.readAt is null")
	int markAllRead(UUID userId, Instant now);

}
