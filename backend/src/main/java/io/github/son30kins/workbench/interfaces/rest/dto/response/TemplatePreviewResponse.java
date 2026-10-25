package io.github.son30kins.workbench.interfaces.rest.dto.response;

import java.time.Instant;
import java.util.List;

import io.github.son30kins.workbench.domain.task.Priority;
import io.github.son30kins.workbench.domain.template.TemplateEngine;

/** Danh sách task sẽ tạo (chưa lưu) + cảnh báo. */
public record TemplatePreviewResponse(List<PlannedTask> tasks, List<String> warnings) {

	public record PlannedTask(String title, String description, Priority priority, Instant dueAt,
			List<String> subtasks, List<String> tags) {
	}

	public static TemplatePreviewResponse from(TemplateEngine.Plan plan) {
		return new TemplatePreviewResponse(plan.tasks()
			.stream()
			.map(t -> new PlannedTask(t.title(), t.description(), t.priority(), t.dueAt(), t.subtasks(), t.tags()))
			.toList(), plan.warnings());
	}

}
