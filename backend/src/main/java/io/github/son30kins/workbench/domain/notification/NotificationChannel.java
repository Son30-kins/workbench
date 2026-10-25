package io.github.son30kins.workbench.domain.notification;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/** Kênh nhận nhắc việc của một người dùng. Hiện chỉ có Telegram. */
@Entity
@Table(name = "notification_channels")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotificationChannel {

	public static final String TELEGRAM = "TELEGRAM";

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	private UUID userId;

	private String type = TELEGRAM;

	private String chatId;

	private String username;

	@Getter(AccessLevel.NONE)
	private boolean enabled;

	/** SHA-256 của mã liên kết một lần — không lưu mã gốc. */
	private String linkTokenHash;

	private Instant linkTokenExpiresAt;

	@CreationTimestamp
	private Instant createdAt;

	@UpdateTimestamp
	private Instant updatedAt;

	public static NotificationChannel telegram(UUID userId) {
		var channel = new NotificationChannel();
		channel.userId = userId;
		return channel;
	}

	public void startLinking(String tokenHash, Instant expiresAt) {
		this.linkTokenHash = tokenHash;
		this.linkTokenExpiresAt = expiresAt;
	}

	public void link(String chatId, String username) {
		this.chatId = chatId;
		this.username = username;
		this.enabled = true;
		this.linkTokenHash = null;
		this.linkTokenExpiresAt = null;
	}

	public void unlink() {
		this.chatId = null;
		this.username = null;
		this.enabled = false;
		this.linkTokenHash = null;
		this.linkTokenExpiresAt = null;
	}

	public boolean isLinked() {
		return enabled && chatId != null;
	}

}
