package io.github.son30kins.workbench.application.reminder;

import java.time.Clock;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import io.github.son30kins.workbench.application.notification.MessageFormatter;
import io.github.son30kins.workbench.application.notification.NotificationService;
import io.github.son30kins.workbench.application.task.TaskService;
import io.github.son30kins.workbench.application.telegram.TelegramNotificationService;
import io.github.son30kins.workbench.domain.shared.TimeZones;
import io.github.son30kins.workbench.domain.user.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

/** Bản tin buổi sáng: mỗi người dùng tối đa 1 lần/ngày, theo giờ địa phương của họ. */
@Slf4j
@Service
@RequiredArgsConstructor
public class DigestService {

	private final UserRepository users;

	private final TaskService tasks;

	private final NotificationService notifications;

	private final TelegramNotificationService telegram;

	private final MessageFormatter formatter;

	private final TransactionTemplate tx;

	private final Clock clock;

	/** @return số bản tin đã gửi */
	public int sendDue() {
		var now = clock.instant();
		var activeUsers = tx.execute(status -> users.findActive());
		int sent = 0;
		for (var user : activeUsers) {
			var digest = user.getEffectiveSettings().digest();
			var zone = user.getZone();
			var today = TimeZones.localDate(now, zone);
			if (!digest.enabled() || now.atZone(zone).toLocalTime().isBefore(digest.localTime())
					|| today.equals(user.getLastDigestOn())) {
				continue;
			}
			// Đánh dấu trước khi gửi → không gửi trùng nếu chạy nhiều instance
			if (!Boolean.TRUE.equals(tx.execute(status -> users.claimDigest(user.getId(), today)))) {
				continue;
			}
			var list = tasks.digest(user.toContext());
			if (list.isEmpty()) {
				continue;
			}
			var locale = user.getLanguage().locale();
			var message = formatter.digest(list, zone, now, locale);
			notifications.add(user.getId(), null, message.title(), "");
			try {
				telegram.sendTo(user.getId(), message.html(), null, locale);
			}
			catch (RuntimeException ex) {
				log.error("Lỗi gửi bản tin cho {}: {}", user.getId(), ex.getMessage());
			}
			sent++;
		}
		return sent;
	}

}
