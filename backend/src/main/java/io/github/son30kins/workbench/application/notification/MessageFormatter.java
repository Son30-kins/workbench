package io.github.son30kins.workbench.application.notification;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import io.github.son30kins.workbench.domain.shared.TimeZones;
import io.github.son30kins.workbench.domain.reminder.ReminderKind;
import io.github.son30kins.workbench.domain.task.Task;

/**
 * Nội dung nhắc việc: tiêu đề/nội dung cho thông báo trong app + HTML cho Telegram.
 * Telegram chỉ hỗ trợ vài thẻ HTML (b, i, a…) và yêu cầu escape &lt; &gt; &amp;.
 */
public final class MessageFormatter {

	private MessageFormatter() {
	}

	public record Message(String title, String body, String html) {
	}

	public static Message reminder(Task task, ReminderKind kind, ZoneId zone, Instant now) {
		var due = task.getDueAt();
		var head = switch (kind) {
			case OVERDUE -> "Quá hạn";
			case SNOOZE -> "Nhắc lại";
			case BEFORE_DUE -> "Sắp đến hạn";
		};
		var icon = switch (kind) {
			case OVERDUE -> "🔴";
			case SNOOZE -> "🔔";
			case BEFORE_DUE -> "⏰";
		};
		var dueText = due == null ? "không có hạn" : TimeZones.format(due, zone, "HH:mm EEEE dd/MM");
		var when = due == null ? "" : (due.isAfter(now) ? "còn " : "trễ ") + distance(due, now);

		var title = head + ": " + task.getTitle();
		var body = due == null ? "" : "Hạn %s (%s)".formatted(dueText, when);

		var lines = new ArrayList<String>();
		lines.add("%s <b>%s</b>".formatted(icon, head));
		lines.add("<b>%s</b>".formatted(escapeHtml(task.getTitle())));
		if (due != null) {
			lines.add("🗓 Hạn: %s — <i>%s</i>".formatted(escapeHtml(dueText), when));
		}
		lines.add("%s Ưu tiên: %s".formatted(task.getPriority().icon(), task.getPriority().label()));
		if (!task.getDescription().isBlank()) {
			var description = task.getDescription();
			lines.add("\n" + escapeHtml(description.length() > 500 ? description.substring(0, 500) : description));
		}
		return new Message(title, body, String.join("\n", lines));
	}

	public static Message digest(List<Task> tasks, ZoneId zone, Instant now) {
		var overdue = tasks.stream().filter(t -> t.getDueAt() != null && t.getDueAt().isBefore(now)).toList();
		var today = tasks.stream().filter(t -> t.getDueAt() != null && !t.getDueAt().isBefore(now)).toList();

		var parts = new ArrayList<String>();
		parts.add("☀️ <b>Bản tin %s</b>".formatted(TimeZones.format(now, zone, "EEEE dd/MM")));
		if (!overdue.isEmpty()) {
			parts.add("");
			parts.add("<b>Quá hạn (%d)</b>".formatted(overdue.size()));
			overdue.stream().limit(15).forEach(t -> parts.add(line(t, zone, "dd/MM HH:mm")));
		}
		if (!today.isEmpty()) {
			parts.add("");
			parts.add("<b>Hôm nay (%d)</b>".formatted(today.size()));
			today.stream().limit(15).forEach(t -> parts.add(line(t, zone, "HH:mm")));
		}
		var summary = new ArrayList<String>();
		if (!today.isEmpty()) {
			summary.add(today.size() + " việc đến hạn hôm nay");
		}
		if (!overdue.isEmpty()) {
			summary.add(overdue.size() + " việc quá hạn");
		}
		return new Message("Bản tin: " + String.join(", ", summary), "", String.join("\n", parts));
	}

	public static String escapeHtml(String s) {
		return Objects.requireNonNullElse(s, "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
	}

	/** Khoảng cách thời gian kiểu "3 giờ", "2 ngày" (làm tròn, như date-fns formatDistanceStrict). */
	static String distance(Instant a, Instant b) {
		long seconds = Math.abs(Duration.between(a, b).toSeconds());
		if (seconds < 60) {
			return seconds + " giây";
		}
		long minutes = Math.round(seconds / 60.0);
		if (minutes < 60) {
			return minutes + " phút";
		}
		long hours = Math.round(seconds / 3600.0);
		if (hours < 24) {
			return hours + " giờ";
		}
		long days = Math.round(seconds / 86_400.0);
		if (days < 30) {
			return days + " ngày";
		}
		long months = Math.round(days / 30.0);
		return months < 12 ? months + " tháng" : Math.round(days / 365.0) + " năm";
	}

	private static String line(Task t, ZoneId zone, String pattern) {
		return "%s %s — <i>%s</i>".formatted(t.getPriority().icon(), escapeHtml(t.getTitle()),
				TimeZones.format(t.getDueAt(), zone, pattern));
	}

}
