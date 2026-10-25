package io.github.son30kins.workbench.domain.template;

import java.time.LocalTime;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import io.github.son30kins.workbench.domain.task.Priority;
import io.github.son30kins.workbench.domain.user.UserSettings;

/** Quy tắc sinh một task từ dữ liệu form. Tiêu đề, mô tả, task con, nhãn đều dùng được {@code {{biến}}}. */
public record TemplateRule(
		@NotBlank @Size(max = 40) String id,
		@NotBlank(message = "{validation.rule.title}") @Size(max = 200) String title,
		@Size(max = 5000) String description,
		@NotNull(message = "{validation.rule.priority}") Priority priority,
		@NotNull @Valid Due due,
		@Valid Condition condition,
		@Size(max = 30) List<@NotBlank @Size(max = 200) String> subtasks,
		@Size(max = 10) List<@NotBlank @Size(max = 40) String> tags) {

	/** Mốc hạn = lúc điền form. */
	public static final String ANCHOR_SUBMITTED = "__submitted__";

	public TemplateRule {
		title = title == null ? null : title.trim();
		description = description == null ? "" : description;
		subtasks = subtasks == null ? List.of() : subtasks.stream().map(String::trim).toList();
		tags = tags == null ? List.of() : tags.stream().map(String::trim).toList();
	}

	/**
	 * Hạn chót = mốc + offset.
	 * @param anchor null = không có hạn; {@link #ANCHOR_SUBMITTED}; hoặc mã của một trường DATE/DATETIME
	 * @param time giờ cố định "HH:mm", hoặc null
	 */
	public record Due(String anchor, @Min(-365) @Max(365) int offsetDays, @Min(-23) @Max(23) int offsetHours,
			@Pattern(regexp = UserSettings.HHMM, message = "Giờ dạng HH:mm") String time) {

		public Due {
			anchor = anchor == null || anchor.isBlank() ? null : anchor;
			time = time == null || time.isBlank() ? null : time;
		}

		public LocalTime localTime() {
			return time == null ? null : LocalTime.parse(time);
		}
	}

	/** Chỉ tạo task khi trường {@code field} có giá trị / được tick ({@code equals} rỗng) hoặc bằng {@code equals}. */
	public record Condition(@NotBlank String field, @Size(max = 80) String equals) {

		public Condition {
			equals = equals == null ? "" : equals;
		}
	}

}
