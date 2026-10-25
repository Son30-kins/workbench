package io.github.son30kins.workbench.application.telegram;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.domain.notification.NotificationChannel;
import io.github.son30kins.workbench.domain.notification.NotificationChannelRepository;
import io.github.son30kins.workbench.domain.user.User;
import io.github.son30kins.workbench.domain.user.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Liên kết tài khoản Telegram: web tạo mã một lần (hết hạn sau 10 phút) → người dùng bấm Start trong
 * Telegram với mã đó → bot gọi {@link #consume}.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class TelegramLinkService {

	private static final Duration LINK_TTL = Duration.ofMinutes(10);

	private static final Pattern TOKEN_FORMAT = Pattern.compile("^[A-Za-z0-9_-]{16,64}$");

	private static final SecureRandom RANDOM = new SecureRandom();

	private final NotificationChannelRepository channels;

	private final UserRepository users;

	private final Clock clock;

	public record ChannelStatus(boolean linked, String username) {
	}

	/** Tạo mã liên kết. Chỉ lưu bản băm SHA-256 — lộ DB cũng không dùng được mã. */
	public String createLinkToken(UUID userId) {
		var bytes = new byte[24];
		RANDOM.nextBytes(bytes);
		var token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
		var channel = channels.findTelegram(userId).orElseGet(() -> channels.save(NotificationChannel.telegram(userId)));
		channel.startLinking(hash(token), clock.instant().plus(LINK_TTL));
		return token;
	}

	/** Bot gọi khi người dùng bấm Start với mã. Trả về email của tài khoản vừa liên kết. */
	public Optional<String> consume(String token, String chatId, String username) {
		if (token == null || !TOKEN_FORMAT.matcher(token).matches()) {
			return Optional.empty();
		}
		return channels.lockByValidLinkToken(hash(token), clock.instant()).flatMap(channel -> {
			channels.detachChatFromOthers(chatId, channel.getId());
			channel.link(chatId, username);
			return users.findById(channel.getUserId()).map(User::getEmail);
		});
	}

	@Transactional(readOnly = true)
	public ChannelStatus status(UUID userId) {
		return channels.findTelegram(userId)
			.map(c -> new ChannelStatus(c.isLinked(), c.getUsername()))
			.orElse(new ChannelStatus(false, null));
	}

	/** Chat Telegram đã liên kết của người dùng (nếu có). */
	@Transactional(readOnly = true)
	public Optional<String> chatOf(UUID userId) {
		return channels.findTelegram(userId).filter(NotificationChannel::isLinked).map(NotificationChannel::getChatId);
	}

	public void unlink(UUID userId) {
		channels.findTelegram(userId).ifPresent(NotificationChannel::unlink);
	}

	/** Người dùng (chưa bị khoá) sở hữu một chat — bot dùng để kiểm tra quyền khi bấm nút. */
	@Transactional(readOnly = true)
	public Optional<User> ownerOf(String chatId) {
		return channels.findLinkedByChat(chatId).flatMap(c -> users.findById(c.getUserId())).filter(u -> !u.isBanned());
	}

	@Transactional(readOnly = true)
	public Set<UUID> linkedUserIds() {
		return channels.findLinkedUserIds();
	}

	static String hash(String token) {
		try {
			var digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(digest);
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException(ex);
		}
	}

}
