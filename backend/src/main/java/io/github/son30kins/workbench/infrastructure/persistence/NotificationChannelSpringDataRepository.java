package io.github.son30kins.workbench.infrastructure.persistence;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.LockModeType;

import io.github.son30kins.workbench.domain.notification.NotificationChannel;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface NotificationChannelSpringDataRepository extends JpaRepository<NotificationChannel, UUID> {

	Optional<NotificationChannel> findByUserIdAndType(UUID userId, String type);

	/** SELECT … FOR UPDATE: khoá dòng tới hết transaction. */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	Optional<NotificationChannel> findByLinkTokenHashAndLinkTokenExpiresAtAfter(String tokenHash, Instant now);

	Optional<NotificationChannel> findByChatIdAndTypeAndEnabledTrue(String chatId, String type);

	@Modifying
	@Query("""
			update NotificationChannel c set c.chatId = null, c.enabled = false
			where c.chatId = :chatId and c.type = :type and c.id <> :keepId
			""")
	void detachChat(String chatId, String type, UUID keepId);

	@Query("select c.userId from NotificationChannel c where c.enabled = true and c.chatId is not null")
	List<UUID> findLinkedUserIds();

}
