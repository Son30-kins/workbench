package io.github.son30kins.workbench.application.reminder;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import io.github.son30kins.workbench.application.notification.MessageFormatter;
import io.github.son30kins.workbench.application.notification.NotificationService;
import io.github.son30kins.workbench.application.telegram.TelegramNotificationService;
import io.github.son30kins.workbench.domain.reminder.Reminder;
import io.github.son30kins.workbench.domain.reminder.ReminderKind;
import io.github.son30kins.workbench.domain.reminder.ReminderRepository;
import io.github.son30kins.workbench.domain.reminder.ReminderSchedule;
import io.github.son30kins.workbench.domain.task.TaskRepository;
import io.github.son30kins.workbench.domain.user.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Gửi các lần nhắc đã đến giờ: thông báo trong app + Telegram. Được job định kỳ gọi.
 * Dùng {@link TransactionTemplate} để chia thành nhiều transaction nhỏ và gửi Telegram ngoài transaction.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderDeliveryService {

	private static final int BATCH = 50;

	private final ReminderRepository reminders;

	private final TaskRepository tasks;

	private final UserRepository users;

	private final NotificationService notifications;

	private final TelegramNotificationService telegram;

	private final MessageFormatter formatter;

	private final TransactionTemplate tx;

	private final Clock clock;

	/** @return số lần nhắc đã lấy ra xử lý */
	public int deliverDue() {
		Instant now = clock.instant();
		// 1) Lấy + đánh dấu SENT trong cùng transaction → không gửi trùng
		List<Reminder> claimed = tx.execute(status -> reminders.claimDue(now, BATCH));
		for (var reminder : claimed) {
			try {
				deliver(reminder, now);
			}
			catch (RuntimeException ex) {
				log.error("Lỗi gửi nhắc {}: {}", reminder.getId(), ex.getMessage());
				tx.executeWithoutResult(status -> reminders.markFailed(reminder.getId(), truncate(ex.getMessage())));
			}
		}
		return claimed.size();
	}

	private record Delivery(UUID userId, UUID taskId, String html, Locale locale) {
	}

	private void deliver(Reminder reminder, Instant now) {
		// 2) Ghi thông báo trong app + hẹn lần nhắc quá hạn tiếp theo
		Delivery delivery = tx.execute(status -> {
			var task = tasks.findById(reminder.getTaskId()).orElse(null);
			var user = task == null ? null : users.findById(task.getUserId()).orElse(null);
			if (task == null || user == null || user.isBanned() || !task.isOpen()) {
				return null;
			}
			var locale = user.getLanguage().locale();
			var message = formatter.reminder(task, reminder.getKind(), user.getZone(), now, locale);
			notifications.add(user.getId(), task.getId(), message.title(), message.body());
			if (reminder.getKind() == ReminderKind.OVERDUE) {
				var next = ReminderSchedule.nextOverdue(reminder.getFireAt(), user.getEffectiveSettings(), user.getZone(),
						now);
				reminders.save(new Reminder(task.getId(), user.getId(), ReminderKind.OVERDUE, next));
			}
			return new Delivery(user.getId(), task.getId(), message.html(), locale);
		});
		// 3) Gửi Telegram ngoài transaction — không giữ kết nối DB trong lúc chờ mạng
		if (delivery != null) {
			try {
				telegram.sendTo(delivery.userId(), delivery.html(), delivery.taskId(), delivery.locale());
			}
			catch (RuntimeException ex) {
				tx.executeWithoutResult(status -> reminders.recordError(reminder.getId(), truncate(ex.getMessage())));
			}
		}
	}

	private static String truncate(String message) {
		var text = String.valueOf(message);
		return text.length() > 500 ? text.substring(0, 500) : text;
	}

}
