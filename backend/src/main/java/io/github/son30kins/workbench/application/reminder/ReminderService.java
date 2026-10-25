package io.github.son30kins.workbench.application.reminder;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.domain.reminder.Reminder;
import io.github.son30kins.workbench.domain.reminder.ReminderKind;
import io.github.son30kins.workbench.domain.reminder.ReminderRepository;
import io.github.son30kins.workbench.domain.reminder.ReminderSchedule;
import io.github.son30kins.workbench.domain.task.Task;
import io.github.son30kins.workbench.domain.user.UserContext;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Lên lịch / huỷ lịch nhắc cho task. {@code MANDATORY}: phải chạy trong transaction của nơi gọi
 * (TaskService) để task và lịch nhắc luôn được lưu cùng nhau.
 */
@Service
@Transactional(propagation = Propagation.MANDATORY)
@RequiredArgsConstructor
public class ReminderService {

	private final ReminderRepository reminders;

	private final Clock clock;

	/** Xoá các lần nhắc chưa gửi rồi tính lại theo hạn + ưu tiên hiện tại của task. */
	public void reschedule(Task task, UserContext owner) {
		reminders.deletePending(task.getId());
		if (!task.isOpen() || task.getDueAt() == null) {
			return;
		}
		Instant now = clock.instant();
		ReminderSchedule.plan(task.getDueAt(), task.getPriority(), owner.settings(), owner.zone(), now)
			.forEach(p -> reminders.save(new Reminder(task.getId(), task.getUserId(), p.kind(), p.fireAt())));
	}

	public void cancelPending(UUID taskId) {
		reminders.deletePending(taskId);
	}

	/** Hoãn: thêm một lần nhắc vào {@code fireAt}. */
	public void snooze(Task task, Instant fireAt) {
		reminders.save(new Reminder(task.getId(), task.getUserId(), ReminderKind.SNOOZE, fireAt));
	}

}
