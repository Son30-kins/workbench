package io.github.son30kins.workbench.domain.notification;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/** Port lưu trữ kênh Telegram của người dùng. */
public interface NotificationChannelRepository {

	NotificationChannel save(NotificationChannel channel);

	Optional<NotificationChannel> findTelegram(UUID userId);

	/** Tìm và KHOÁ kênh theo mã liên kết còn hạn → một mã chỉ dùng được 1 lần. */
	Optional<NotificationChannel> lockByValidLinkToken(String tokenHash, Instant now);

	Optional<NotificationChannel> findLinkedByChat(String chatId);

	/** Một chat Telegram chỉ gắn với một tài khoản: gỡ chat khỏi mọi kênh khác {@code keepId}. */
	void detachChatFromOthers(String chatId, UUID keepId);

	Set<UUID> findLinkedUserIds();

}
