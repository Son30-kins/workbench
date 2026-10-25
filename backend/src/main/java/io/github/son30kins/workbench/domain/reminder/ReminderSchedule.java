package io.github.son30kins.workbench.domain.reminder;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import io.github.son30kins.workbench.domain.shared.TimeZones;
import io.github.son30kins.workbench.domain.task.Priority;
import io.github.son30kins.workbench.domain.user.UserSettings;

/**
 * Tính các mốc nhắc việc — hàm thuần (không đọc DB, không đọc đồng hồ hệ thống) nên test dễ.
 */
public final class ReminderSchedule {

	public record Planned(ReminderKind kind, Instant fireAt) {
	}

	private ReminderSchedule() {
	}

	/**
	 * Nếu {@code t} rơi vào giờ yên lặng thì trả về lúc giờ yên lặng kết thúc.
	 * Hỗ trợ khung qua nửa đêm (22:00 → 07:00).
	 */
	public static Optional<Instant> quietHoursEnd(Instant t, UserSettings.QuietHours quiet, ZoneId zone) {
		if (!quiet.enabled()) {
			return Optional.empty();
		}
		LocalTime start = quiet.startTime();
		LocalTime end = quiet.endTime();
		if (start.equals(end)) {
			return Optional.empty();
		}
		var local = t.atZone(zone);
		var now = local.toLocalTime().withSecond(0).withNano(0);
		var date = local.toLocalDate();

		if (start.isBefore(end)) {
			// Khung trong ngày, ví dụ 12:00 → 13:30
			boolean inside = !now.isBefore(start) && now.isBefore(end);
			return inside ? Optional.of(TimeZones.fromLocal(date, end, zone)) : Optional.empty();
		}
		// Khung qua nửa đêm
		if (!now.isBefore(start)) {
			return Optional.of(TimeZones.fromLocal(date.plusDays(1), end, zone));
		}
		if (now.isBefore(end)) {
			return Optional.of(TimeZones.fromLocal(date, end, zone));
		}
		return Optional.empty();
	}

	/** Lúc bắt đầu của khung giờ yên lặng chứa {@code t} (giả định {@code t} nằm trong khung). */
	private static Instant quietHoursStart(Instant t, UserSettings.QuietHours quiet, ZoneId zone) {
		var local = t.atZone(zone);
		var date = local.toLocalTime().isBefore(quiet.startTime()) ? local.toLocalDate().minusDays(1) : local.toLocalDate();
		return TimeZones.fromLocal(date, quiet.startTime(), zone);
	}

	/**
	 * Dời một mốc nhắc ra khỏi giờ yên lặng:
	 * <ul>
	 * <li>bình thường: dời tới lúc giờ yên lặng kết thúc</li>
	 * <li>nếu dời như vậy sẽ trễ hạn: nhắc sớm hơn, ngay trước khi giờ yên lặng bắt đầu</li>
	 * <li>nếu cả hai đều không được (đã qua): giữ nguyên</li>
	 * </ul>
	 */
	public static Instant avoidQuietHours(Instant t, UserSettings.QuietHours quiet, ZoneId zone, Instant now,
			Instant deadline) {
		var end = quietHoursEnd(t, quiet, zone);
		if (end.isEmpty()) {
			return t;
		}
		if (deadline == null || end.get().isBefore(deadline)) {
			return end.get();
		}
		var before = quietHoursStart(t, quiet, zone).minus(Duration.ofMinutes(1));
		return before.isAfter(now) ? before : t;
	}

	/** Các mốc nhắc cho một task. Task khẩn cấp bỏ qua giờ yên lặng. */
	public static List<Planned> plan(Instant dueAt, Priority priority, UserSettings settings, ZoneId zone,
			Instant now) {
		if (dueAt == null) {
			return List.of();
		}
		var result = new ArrayList<Planned>();
		var seen = new HashSet<Instant>();

		for (int minutes : settings.offsetsFor(priority)) {
			var t = dueAt.minus(Duration.ofMinutes(minutes));
			if (priority != Priority.URGENT) {
				t = avoidQuietHours(t, settings.quietHours(), zone, now, dueAt);
			}
			if (t.isAfter(now) && seen.add(t)) {
				result.add(new Planned(ReminderKind.BEFORE_DUE, t));
			}
		}
		// Nhắc đúng lúc hết hạn
		if (dueAt.isAfter(now) && seen.add(dueAt)) {
			result.add(new Planned(ReminderKind.OVERDUE, dueAt));
		}
		result.sort(Comparator.comparing(Planned::fireAt));
		return List.copyOf(result);
	}

	/** Lần nhắc quá hạn tiếp theo (lặp lại), luôn tránh giờ yên lặng. */
	public static Instant nextOverdue(Instant lastFireAt, UserSettings settings, ZoneId zone, Instant now) {
		var repeat = Duration.ofHours(settings.overdueRepeatHours());
		var t = lastFireAt.plus(repeat);
		if (!t.isAfter(now)) {
			t = now.plus(repeat);
		}
		return avoidQuietHours(t, settings.quietHours(), zone, now, null);
	}

}
