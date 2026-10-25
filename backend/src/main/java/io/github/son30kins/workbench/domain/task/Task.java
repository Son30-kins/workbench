package io.github.son30kins.workbench.domain.task;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

/** Aggregate task — gồm cả danh sách task con ({@link Subtask}). */
@Entity
@Table(name = "tasks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Task {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	/** Chủ sở hữu. Mọi truy vấn của người dùng đều lọc theo cột này. */
	@Column(nullable = false, updatable = false)
	private UUID userId;

	private String title;

	private String description = "";

	private Instant dueAt;

	@Enumerated(EnumType.STRING)
	private Priority priority = Priority.MEDIUM;

	/** Cột do Postgres tự tính (generated column) — chỉ đọc, dùng để sắp xếp. */
	@Getter(AccessLevel.NONE)
	@Column(insertable = false, updatable = false)
	private Short priorityRank;

	@Enumerated(EnumType.STRING)
	private TaskStatus status = TaskStatus.TODO;

	@JdbcTypeCode(SqlTypes.ARRAY)
	@Column(columnDefinition = "text[]")
	private List<String> tags = new ArrayList<>();

	private UUID templateRunId;

	private String templateName;

	private Instant completedAt;

	@CreationTimestamp
	private Instant createdAt;

	@UpdateTimestamp
	private Instant updatedAt;

	/**
	 * EAGER: thẻ task luôn hiện tiến độ task con, và controller đổi entity → DTO ngoài transaction
	 * (open-in-view tắt). Hibernate nạp gộp theo lô (default_batch_fetch_size) nên không bị N+1.
	 */
	@OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
	@OrderBy("position")
	private List<Subtask> subtasks = new ArrayList<>();

	public Task(UUID userId) {
		this.userId = userId;
	}

	/** Gán dữ liệu từ form; trả về true nếu hạn / ưu tiên / trạng thái đổi (cần tính lại lịch nhắc). */
	public boolean apply(TaskData data, Instant now) {
		boolean scheduleChanged = !Objects.equals(dueAt, data.dueAt()) || priority != data.priority()
				|| status != data.status();
		this.title = data.title();
		this.description = data.description();
		this.dueAt = data.dueAt();
		this.priority = data.priority();
		this.tags = new ArrayList<>(data.tags());
		changeStatus(data.status(), now);
		replaceSubtasks(data.subtasks());
		return scheduleChanged;
	}

	/** Đổi trạng thái; ghi lại lúc hoàn thành khi chuyển sang DONE. */
	public void changeStatus(TaskStatus newStatus, Instant now) {
		if (newStatus == TaskStatus.DONE) {
			if (status != TaskStatus.DONE || completedAt == null) {
				completedAt = now;
			}
		}
		else {
			completedAt = null;
		}
		this.status = newStatus;
	}

	public boolean isOpen() {
		return TaskStatus.ACTIVE.contains(status);
	}

	public void linkTemplateRun(UUID runId, String templateName) {
		this.templateRunId = runId;
		this.templateName = templateName;
	}

	private void replaceSubtasks(List<TaskData.SubtaskData> items) {
		subtasks.clear();
		for (int i = 0; i < items.size(); i++) {
			subtasks.add(new Subtask(this, items.get(i).title(), items.get(i).done(), i));
		}
	}

}
