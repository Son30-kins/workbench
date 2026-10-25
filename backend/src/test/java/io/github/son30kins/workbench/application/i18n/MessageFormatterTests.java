package io.github.son30kins.workbench.application.i18n;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Locale;
import java.util.UUID;

import io.github.son30kins.workbench.application.notification.MessageFormatter;
import io.github.son30kins.workbench.domain.reminder.ReminderKind;
import io.github.son30kins.workbench.domain.task.Priority;
import io.github.son30kins.workbench.domain.task.Task;
import io.github.son30kins.workbench.domain.task.TaskData;
import org.junit.jupiter.api.Test;

import org.springframework.context.support.ResourceBundleMessageSource;

import static org.assertj.core.api.Assertions.assertThat;

/** Nội dung nhắc việc theo ngôn ngữ người nhận — cấu hình MessageSource giống application.yml. */
class MessageFormatterTests {

	static final ZoneId BERLIN = ZoneId.of("Europe/Berlin");

	static final Instant NOW = Instant.parse("2026-10-26T08:00:00Z");

	final MessageFormatter formatter = new MessageFormatter(new Translator(messageSource()));

	@Test
	void nhacViecTiengAnh_soNhieu() {
		var message = formatter.reminder(task("Pay rent", NOW.plus(Duration.ofHours(3))), ReminderKind.BEFORE_DUE,
				BERLIN, NOW, Locale.ENGLISH);
		assertThat(message.title()).isEqualTo("Due soon: Pay rent");
		assertThat(message.body()).isEqualTo("Due Mon, Oct 26, 12:00 (3 hours left)");
		assertThat(message.html()).contains("Priority: High");
	}

	@Test
	void nhacViecTiengDuc_soIt() {
		var message = formatter.reminder(task("Miete zahlen", NOW.minus(Duration.ofDays(1))), ReminderKind.OVERDUE,
				BERLIN, NOW, Locale.GERMAN);
		assertThat(message.title()).isEqualTo("Überfällig: Miete zahlen");
		assertThat(message.body()).endsWith("(1 Tag überfällig)");
		assertThat(message.html()).contains("Priorität: Hoch");
	}

	@Test
	void ngonNguLa_thiDungTiengViet() {
		var message = formatter.reminder(task("Nộp báo cáo", null), ReminderKind.SNOOZE, BERLIN, NOW, Locale.FRENCH);
		assertThat(message.title()).isEqualTo("Nhắc lại: Nộp báo cáo");
		assertThat(message.html()).contains("Ưu tiên: Cao");
	}

	private static Task task(String title, Instant dueAt) {
		var task = new Task(UUID.randomUUID());
		task.apply(TaskData.of(title, dueAt, Priority.HIGH), NOW);
		return task;
	}

	static ResourceBundleMessageSource messageSource() {
		var source = new ResourceBundleMessageSource();
		source.setBasename("messages");
		source.setDefaultEncoding("UTF-8");
		source.setFallbackToSystemLocale(false);
		source.setAlwaysUseMessageFormat(true);
		return source;
	}

}
