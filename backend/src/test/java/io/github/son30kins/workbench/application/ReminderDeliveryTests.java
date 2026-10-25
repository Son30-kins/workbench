package io.github.son30kins.workbench.application;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import io.github.son30kins.workbench.IntegrationTest;
import io.github.son30kins.workbench.TestFixtures;
import io.github.son30kins.workbench.application.reminder.ReminderDeliveryService;
import io.github.son30kins.workbench.domain.reminder.Reminder;
import io.github.son30kins.workbench.domain.reminder.ReminderKind;
import io.github.son30kins.workbench.domain.reminder.ReminderRepository;
import io.github.son30kins.workbench.application.notification.NotificationService;
import io.github.son30kins.workbench.domain.shared.Language;
import io.github.son30kins.workbench.domain.task.Priority;
import io.github.son30kins.workbench.domain.task.TaskData;
import io.github.son30kins.workbench.application.task.TaskService;
import io.github.son30kins.workbench.domain.task.TaskStatus;
import io.github.son30kins.workbench.domain.user.Role;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@IntegrationTest
class ReminderDeliveryTests {

	@Autowired
	TestFixtures fixtures;

	@Autowired
	TaskService tasks;

	@Autowired
	ReminderDeliveryService job;

	@Autowired
	ReminderRepository reminders;

	@Autowired
	NotificationService notifications;

	@Autowired
	JdbcTemplate jdbc;

	@Test
	void taoTaskThiLenLichNhac_doiTrangThaiThiHuyLich() {
		var owner = fixtures.context(Role.USER);
		var task = tasks.create(owner, TaskData.of("Có hạn", Instant.now().plus(Duration.ofDays(3)), Priority.HIGH));
		assertThat(reminders.findByTask(task.getId(), Reminder.Status.PENDING)).hasSize(3);

		tasks.changeStatus(owner, task.getId(), TaskStatus.DONE);
		assertThat(reminders.findByTask(task.getId(), Reminder.Status.PENDING)).isEmpty();

		tasks.changeStatus(owner, task.getId(), TaskStatus.TODO);
		assertThat(reminders.findByTask(task.getId(), Reminder.Status.PENDING)).hasSize(3);
	}

	@Test
	void guiMoiLanNhacDungMotLan_vaHenLanQuaHanTiepTheo() {
		var owner = fixtures.context(Role.USER);
		var task = tasks.create(owner, TaskData.of("Sắp quá hạn", Instant.now().plus(Duration.ofDays(1)), Priority.LOW));
		// Đẩy lần nhắc OVERDUE về quá khứ để job lấy ra ngay
		jdbc.update("update reminders set fire_at = now() - interval '1 minute' where task_id = ?", task.getId());

		int first = job.deliverDue();
		int second = job.deliverDue();

		assertThat(first).isGreaterThanOrEqualTo(1);
		assertThat(second).isZero();
		assertThat(reminders.findByTask(task.getId(), Reminder.Status.SENT)).hasSize(1);
		// Lần nhắc quá hạn tiếp theo được hẹn trong tương lai
		List<Reminder> pending = reminders.findByTask(task.getId(), Reminder.Status.PENDING);
		assertThat(pending).singleElement().satisfies(r -> {
			assertThat(r.getKind()).isEqualTo(ReminderKind.OVERDUE);
			assertThat(r.getFireAt()).isAfter(Instant.now());
		});
		assertThat(notifications.inbox(owner.id()).items()).extracting("title").containsExactly("Quá hạn: Sắp quá hạn");
	}

	@Test
	void thongBaoTheoNgonNguCuaNguoiNhan() {
		var owner = fixtures.user(Role.USER, Language.DE).toContext();
		var task = tasks.create(owner, TaskData.of("Miete zahlen", Instant.now().plus(Duration.ofDays(1)), Priority.LOW));
		jdbc.update("update reminders set fire_at = now() - interval '1 minute' where task_id = ?", task.getId());

		job.deliverDue();

		assertThat(notifications.inbox(owner.id()).items()).extracting("title")
			.containsExactly("Überfällig: Miete zahlen");
	}

}
