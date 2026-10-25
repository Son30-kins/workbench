package io.github.son30kins.workbench.domain.task;

import java.time.Instant;
import java.time.ZoneId;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import io.github.son30kins.workbench.domain.shared.TimeZones;

/** Bộ lọc nhanh trên bảng / danh sách: tất cả, hôm nay, quá hạn, 7 ngày tới. */
public enum TaskView {

	ALL, TODAY, OVERDUE, WEEK;

	/** "today" → TODAY; giá trị lạ → ALL. */
	public static TaskView parse(String value) {
		if (value == null) {
			return ALL;
		}
		try {
			return valueOf(value.toUpperCase(Locale.ROOT));
		}
		catch (IllegalArgumentException ex) {
			return ALL;
		}
	}

	/** Việc đang mở (Cần làm, Đang làm) thuộc view này. */
	public TaskSearch openTasks(UUID userId, ZoneId zone, Instant now, String text) {
		var window = window(zone, now);
		return new TaskSearch(userId, window.from(), window.before(), TaskStatus.ACTIVE, text, 0, TaskSearch.Order.BOARD);
	}

	/** Việc đã xong thuộc view này (view "Quá hạn" không có việc đã xong). */
	public Optional<TaskSearch> doneTasks(UUID userId, ZoneId zone, Instant now, String text, int limit) {
		if (this == OVERDUE) {
			return Optional.empty();
		}
		var window = window(zone, now);
		return Optional.of(new TaskSearch(userId, window.from(), window.before(), Set.of(TaskStatus.DONE), text, limit,
				TaskSearch.Order.RECENTLY_COMPLETED));
	}

	private record Window(Instant from, Instant before) {
	}

	private Window window(ZoneId zone, Instant now) {
		var today = TimeZones.startOfLocalDay(now, zone);
		return switch (this) {
			case ALL -> new Window(null, null);
			case TODAY -> new Window(today, TimeZones.addLocalDays(today, 1, zone));
			case WEEK -> new Window(today, TimeZones.addLocalDays(today, 7, zone));
			case OVERDUE -> new Window(null, now);
		};
	}

}
