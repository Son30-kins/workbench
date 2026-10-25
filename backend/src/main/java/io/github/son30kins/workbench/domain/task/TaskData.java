package io.github.son30kins.workbench.domain.task;

import java.time.Instant;
import java.util.List;

/**
 * Dữ liệu đã chuẩn hoá để tạo / sửa một task (hạn chót đã đổi sang Instant theo múi giờ người dùng).
 * Dùng chung cho API, form mẫu và test.
 */
public record TaskData(String title, String description, Instant dueAt, Priority priority, TaskStatus status,
		List<String> tags, List<SubtaskData> subtasks) {

	public record SubtaskData(String title, boolean done) {
	}

	public TaskData {
		description = description == null ? "" : description;
		priority = priority == null ? Priority.MEDIUM : priority;
		status = status == null ? TaskStatus.TODO : status;
		tags = tags == null ? List.of() : tags.stream().map(String::trim).filter(t -> !t.isEmpty()).distinct().toList();
		subtasks = subtasks == null ? List.of()
				: subtasks.stream()
					.filter(s -> s.title() != null && !s.title().isBlank())
					.map(s -> new SubtaskData(s.title().trim(), s.done()))
					.toList();
	}

	public static TaskData of(String title, Instant dueAt, Priority priority) {
		return new TaskData(title, "", dueAt, priority, TaskStatus.TODO, List.of(), List.of());
	}

}
