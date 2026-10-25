package io.github.son30kins.workbench.application.notification;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.application.i18n.Translator;
import io.github.son30kins.workbench.domain.reminder.ReminderKind;
import io.github.son30kins.workbench.domain.shared.TimeZones;
import io.github.son30kins.workbench.domain.task.Priority;
import io.github.son30kins.workbench.domain.task.Task;

import org.springframework.stereotype.Component;

/**
 * Nội dung nhắc việc theo ngôn ngữ người nhận: tiêu đề/nội dung cho thông báo trong app + HTML cho Telegram.
 * Telegram chỉ hỗ trợ vài thẻ HTML (b, i, a…) và yêu cầu escape &lt; &gt; &amp;.
 */
@Component
@RequiredArgsConstructor
public class MessageFormatter {

	private final Translator translator;

	public record Message(String title, String body, String html) {
	}

	public Message reminder(Task task, ReminderKind kind, ZoneId zone, Instant now, Locale locale) {
		var due = task.getDueAt();
		var head = t(locale, "reminder.kind." + kind.name());
		var icon = switch (kind) {
			case OVERDUE -> "🔴";
			case SNOOZE -> "🔔";
			case BEFORE_DUE -> "⏰";
		};
		var dueText = due == null ? t(locale, "reminder.noDue")
				: TimeZones.format(due, zone, t(locale, "format.reminderDue"), locale);
		var when = due == null ? ""
				: t(locale, due.isAfter(now) ? "reminder.remaining" : "reminder.late", distance(due, now, locale));

		var title = t(locale, "reminder.title", head, task.getTitle());
		var body = due == null ? "" : t(locale, "reminder.body", dueText, when);

		var lines = new ArrayList<String>();
		lines.add("%s <b>%s</b>".formatted(icon, head));
		lines.add("<b>%s</b>".formatted(escapeHtml(task.getTitle())));
		if (due != null) {
			lines.add("🗓 %s: %s — <i>%s</i>".formatted(t(locale, "reminder.due"), escapeHtml(dueText), when));
		}
		lines.add("%s %s: %s".formatted(task.getPriority().icon(), t(locale, "reminder.priority"),
				priority(task.getPriority(), locale)));
		if (!task.getDescription().isBlank()) {
			var description = task.getDescription();
			lines.add("\n" + escapeHtml(description.length() > 500 ? description.substring(0, 500) : description));
		}
		return new Message(title, body, String.join("\n", lines));
	}

	public Message digest(List<Task> tasks, ZoneId zone, Instant now, Locale locale) {
		var overdue = tasks.stream().filter(t -> t.getDueAt() != null && t.getDueAt().isBefore(now)).toList();
		var today = tasks.stream().filter(t -> t.getDueAt() != null && !t.getDueAt().isBefore(now)).toList();

		var parts = new ArrayList<String>();
		parts.add("☀️ <b>%s</b>".formatted(
				t(locale, "digest.heading", TimeZones.format(now, zone, t(locale, "format.digestDay"), locale))));
		if (!overdue.isEmpty()) {
			parts.add("");
			parts.add("<b>%s</b>".formatted(t(locale, "digest.overdue", overdue.size())));
			overdue.stream().limit(15).forEach(t -> parts.add(line(t, zone, "dd/MM HH:mm", locale)));
		}
		if (!today.isEmpty()) {
			parts.add("");
			parts.add("<b>%s</b>".formatted(t(locale, "digest.today", today.size())));
			today.stream().limit(15).forEach(t -> parts.add(line(t, zone, "HH:mm", locale)));
		}
		var summary = new ArrayList<String>();
		if (!today.isEmpty()) {
			summary.add(t(locale, "digest.summary.today", today.size()));
		}
		if (!overdue.isEmpty()) {
			summary.add(t(locale, "digest.summary.overdue", overdue.size()));
		}
		return new Message(t(locale, "digest.title", String.join(", ", summary)), "", String.join("\n", parts));
	}

	public String priority(Priority priority, Locale locale) {
		return t(locale, "priority." + priority.name());
	}

	public static String escapeHtml(String s) {
		return Objects.requireNonNullElse(s, "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
	}

	/** Khoảng cách thời gian kiểu "3 giờ", "2 days" (làm tròn, như date-fns formatDistanceStrict). */
	String distance(Instant a, Instant b, Locale locale) {
		long seconds = Math.abs(Duration.between(a, b).toSeconds());
		if (seconds < 60) {
			return t(locale, "duration.seconds", seconds);
		}
		long minutes = Math.round(seconds / 60.0);
		if (minutes < 60) {
			return t(locale, "duration.minutes", minutes);
		}
		long hours = Math.round(seconds / 3600.0);
		if (hours < 24) {
			return t(locale, "duration.hours", hours);
		}
		long days = Math.round(seconds / 86_400.0);
		if (days < 30) {
			return t(locale, "duration.days", days);
		}
		long months = Math.round(days / 30.0);
		return months < 12 ? t(locale, "duration.months", months)
				: t(locale, "duration.years", Math.round(days / 365.0));
	}

	private String line(Task t, ZoneId zone, String pattern, Locale locale) {
		return "%s %s — <i>%s</i>".formatted(t.getPriority().icon(), escapeHtml(t.getTitle()),
				TimeZones.format(t.getDueAt(), zone, pattern, locale));
	}

	private String t(Locale locale, String code, Object... args) {
		return translator.get(locale, code, args);
	}

}
