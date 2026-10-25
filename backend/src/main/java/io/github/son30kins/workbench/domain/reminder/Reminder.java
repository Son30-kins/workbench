package io.github.son30kins.workbench.domain.reminder;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

/** Một lần nhắc đã lên lịch. Job lấy các lần nhắc đến giờ, gửi rồi đánh dấu SENT. */
@Entity
@Table(name = "reminders")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Reminder {

	public enum Status {

		PENDING, SENT, CANCELLED, FAILED

	}

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	private UUID taskId;

	private UUID userId;

	@Enumerated(EnumType.STRING)
	private ReminderKind kind;

	private Instant fireAt;

	@Enumerated(EnumType.STRING)
	private Status status = Status.PENDING;

	private Instant sentAt;

	private String lastError;

	@CreationTimestamp
	private Instant createdAt;

	public Reminder(UUID taskId, UUID userId, ReminderKind kind, Instant fireAt) {
		this.taskId = taskId;
		this.userId = userId;
		this.kind = kind;
		this.fireAt = fireAt;
	}

}
