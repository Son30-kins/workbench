package io.github.son30kins.workbench.application.telegram;

import java.time.Clock;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.application.notification.MessageFormatter;
import io.github.son30kins.workbench.application.task.TaskService;
import io.github.son30kins.workbench.domain.shared.TimeZones;
import io.github.son30kins.workbench.domain.task.TaskStatus;

import org.springframework.stereotype.Service;

/**
 * Nghiệp vụ đằng sau các lệnh / nút bấm của bot Telegram. Adapter {@code TelegramBot} (infrastructure) chỉ lo
 * nhận tin và gửi trả lời; quyết định trả lời gì nằm ở đây.
 */
@Service
@RequiredArgsConstructor
public class TelegramCommandService {

	public static final String HELP = """
			Bot nhắc việc của Workbench.

			/today — việc hôm nay và việc quá hạn
			/help — hướng dẫn

			Để kết nối: mở app → Cài đặt → “Kết nối Telegram”.""";

	private static final String NOT_LINKED = "Chat này chưa kết nối tài khoản nào. Mở app → Cài đặt → “Kết nối Telegram”.";

	private final TelegramLinkService links;

	private final TaskService tasks;

	private final Clock clock;

	/** Kết quả một nút bấm: câu trả lời ngắn (popup) + có cần đánh dấu tin là "Đã xong" không. */
	public record ButtonResult(String answer, boolean alert, boolean markDone) {
	}

	/** /start [mã] — có mã thì liên kết tài khoản. Trả về HTML để gửi lại. */
	public String start(String code, String chatId, String username) {
		if (code == null || code.isBlank()) {
			return MessageFormatter.escapeHtml(HELP);
		}
		return links.consume(code.trim(), chatId, username)
			.map(email -> "✅ Đã kết nối với tài khoản " + MessageFormatter.escapeHtml(email)
					+ ". Bạn sẽ nhận nhắc việc tại đây.")
			.orElse("❌ Mã kết nối không hợp lệ hoặc đã hết hạn. Tạo mã mới trong app → Cài đặt.");
	}

	public String help() {
		return MessageFormatter.escapeHtml(HELP);
	}

	/** /today — việc hôm nay + quá hạn của chủ chat. */
	public String today(String chatId) {
		return links.ownerOf(chatId).map(owner -> {
			var context = owner.toContext();
			var list = tasks.digest(context);
			return list.isEmpty() ? "🎉 Không có việc nào đến hạn hôm nay hoặc quá hạn."
					: MessageFormatter.digest(list, context.zone(), clock.instant()).html();
		}).orElse(NOT_LINKED);
	}

	/** Nút trong tin nhắc: "done:&lt;id&gt;", "s1h:&lt;id&gt;" (hoãn 1 giờ), "stm:&lt;id&gt;" (hoãn tới sáng mai). */
	public ButtonResult button(String chatId, String data) {
		var separator = data.indexOf(':');
		var owner = links.ownerOf(chatId);
		Optional<UUID> taskId = separator < 0 ? Optional.empty() : parseUuid(data.substring(separator + 1));
		if (owner.isEmpty() || taskId.isEmpty()) {
			return new ButtonResult("Chat này chưa kết nối tài khoản", true, false);
		}
		var context = owner.get().toContext();
		var action = data.substring(0, separator);
		return switch (action) {
			case "done" -> tasks.changeStatus(context, taskId.get(), TaskStatus.DONE).isPresent()
					? new ButtonResult("✅ Đã đánh dấu xong", false, true)
					: new ButtonResult("Không tìm thấy task", true, false);
			case "s1h", "stm" -> {
				var now = clock.instant();
				var fireAt = action.equals("s1h") ? now.plus(Duration.ofHours(1))
						: TimeZones.fromLocal(TimeZones.localDate(now, context.zone()).plusDays(1),
								context.settings().digest().localTime(), context.zone());
				boolean ok = tasks.snooze(context, taskId.get(), fireAt);
				yield new ButtonResult(ok ? (action.equals("s1h") ? "⏰ Sẽ nhắc lại sau 1 giờ" : "📅 Sẽ nhắc lại sáng mai")
						: "Task đã xong hoặc không còn tồn tại", false, false);
			}
			default -> new ButtonResult(null, false, false);
		};
	}

	private static Optional<UUID> parseUuid(String value) {
		try {
			return Optional.of(UUID.fromString(value));
		}
		catch (IllegalArgumentException ex) {
			return Optional.empty();
		}
	}

}
