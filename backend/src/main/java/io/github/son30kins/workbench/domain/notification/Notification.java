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

/** Thông báo trong app (chuông trên header). */
@Entity
@Table(name = "notifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	private UUID userId;

	private UUID taskId;

	private String title;

	private String body = "";

	private Instant readAt;

	@CreationTimestamp
	private Instant createdAt;

	public Notification(UUID userId, UUID taskId, String title, String body) {
		this.userId = userId;
		this.taskId = taskId;
		this.title = title;
		this.body = body == null ? "" : body;
	}

}
