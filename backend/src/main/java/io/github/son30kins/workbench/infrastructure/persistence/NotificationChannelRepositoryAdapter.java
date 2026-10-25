package io.github.son30kins.workbench.infrastructure.persistence;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.domain.notification.NotificationChannel;
import io.github.son30kins.workbench.domain.notification.NotificationChannelRepository;

import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
class NotificationChannelRepositoryAdapter implements NotificationChannelRepository {

	private final NotificationChannelSpringDataRepository jpa;

	@Override
	public NotificationChannel save(NotificationChannel channel) {
		return jpa.save(channel);
	}

	@Override
	public Optional<NotificationChannel> findTelegram(UUID userId) {
		return jpa.findByUserIdAndType(userId, NotificationChannel.TELEGRAM);
	}

	@Override
	public Optional<NotificationChannel> lockByValidLinkToken(String tokenHash, Instant now) {
		return jpa.findByLinkTokenHashAndLinkTokenExpiresAtAfter(tokenHash, now);
	}

	@Override
	public Optional<NotificationChannel> findLinkedByChat(String chatId) {
		return jpa.findByChatIdAndTypeAndEnabledTrue(chatId, NotificationChannel.TELEGRAM);
	}

	@Override
	public void detachChatFromOthers(String chatId, UUID keepId) {
		jpa.detachChat(chatId, NotificationChannel.TELEGRAM, keepId);
	}

	@Override
	public Set<UUID> findLinkedUserIds() {
		return Set.copyOf(jpa.findLinkedUserIds());
	}

}
