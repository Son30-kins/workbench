package io.github.son30kins.workbench.application.telegram;

import java.time.Clock;
import java.time.Duration;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.application.i18n.Translator;
import io.github.son30kins.workbench.application.notification.MessageFormatter;
import io.github.son30kins.workbench.application.task.TaskService;
import io.github.son30kins.workbench.domain.shared.Language;
import io.github.son30kins.workbench.domain.shared.TimeZones;
import io.github.son30kins.workbench.domain.task.TaskStatus;

import org.springframework.stereotype.Service;

/**
 * Nghiệp vụ đằng sau các lệnh / nút bấm của bot Telegram. Adapter {@code TelegramBot} (infrastructure) chỉ lo
 * nhận tin và gửi trả lời; quyết định trả lời gì nằm ở đây.
 *
 * <p>
 * Ngôn ngữ trả lời: chat đã liên kết → ngôn ngữ của tài khoản; chưa liên kết → ngôn ngữ app Telegram của người gửi
 * ({@code clientLanguage}, ví dụ "de"), không hỗ trợ thì tiếng Việt.
 */
@Service
@RequiredArgsConstructor
public class TelegramCommandService {

	private final TelegramLinkService links;

	private final TaskService tasks;

	private final MessageFormatter formatter;

	private final Translator translator;

	private final Clock clock;

	/** Kết quả một nút bấm: câu trả lời ngắn (popup) + có cần đánh dấu tin là "Đã xong" không. */
	public record ButtonResult(String answer, boolean alert, boolean markDone, Locale locale) {
	}

	/** /start [mã] — có mã thì liên kết tài khoản. Trả về HTML để gửi lại. */
	public String start(String code, String chatId, String username, String clientLanguage) {
		if (code == null || code.isBlank()) {
			return help(chatId, clientLanguage);
		}
		return links.consume(code.trim(), chatId, username)
			// Vừa liên kết → trả lời bằng ngôn ngữ của tài khoản
			.map(email -> translator.get(localeOf(chatId, clientLanguage), "telegram.linked",
					MessageFormatter.escapeHtml(email)))
			.orElseGet(() -> translator.get(localeOf(chatId, clientLanguage), "telegram.invalidCode"));
	}

	public String help(String chatId, String clientLanguage) {
		return MessageFormatter.escapeHtml(translator.get(localeOf(chatId, clientLanguage), "telegram.help"));
	}

	/** /today — việc hôm nay + quá hạn của chủ chat. */
	public String today(String chatId, String clientLanguage) {
		return links.ownerOf(chatId).map(owner -> {
			var context = owner.toContext();
			var list = tasks.digest(context);
			return list.isEmpty() ? translator.get(context.locale(), "telegram.nothingToday")
					: formatter.digest(list, context.zone(), clock.instant(), context.locale()).html();
		}).orElseGet(() -> translator.get(clientLocale(clientLanguage), "telegram.notLinked"));
	}

	/** Nút trong tin nhắc: "done:&lt;id&gt;", "s1h:&lt;id&gt;" (hoãn 1 giờ), "stm:&lt;id&gt;" (hoãn tới sáng mai). */
	public ButtonResult button(String chatId, String data, String clientLanguage) {
		var separator = data.indexOf(':');
		var owner = links.ownerOf(chatId);
		Optional<UUID> taskId = separator < 0 ? Optional.empty() : parseUuid(data.substring(separator + 1));
		if (owner.isEmpty() || taskId.isEmpty()) {
			var locale = clientLocale(clientLanguage);
			return new ButtonResult(translator.get(locale, "telegram.button.notLinked"), true, false, locale);
		}
		var context = owner.get().toContext();
		var locale = context.locale();
		var action = data.substring(0, separator);
		return switch (action) {
			case "done" -> tasks.changeStatus(context, taskId.get(), TaskStatus.DONE).isPresent()
					? new ButtonResult(translator.get(locale, "telegram.button.done"), false, true, locale)
					: new ButtonResult(translator.get(locale, "telegram.button.notFound"), true, false, locale);
			case "s1h", "stm" -> {
				var now = clock.instant();
				var fireAt = action.equals("s1h") ? now.plus(Duration.ofHours(1))
						: TimeZones.fromLocal(TimeZones.localDate(now, context.zone()).plusDays(1),
								context.settings().digest().localTime(), context.zone());
				boolean ok = tasks.snooze(context, taskId.get(), fireAt);
				var code = !ok ? "telegram.button.gone"
						: action.equals("s1h") ? "telegram.button.snoozedHour" : "telegram.button.snoozedMorning";
				yield new ButtonResult(translator.get(locale, code), false, false, locale);
			}
			default -> new ButtonResult(null, false, false, locale);
		};
	}

	/** Chat đã liên kết → ngôn ngữ tài khoản; chưa → ngôn ngữ app Telegram. */
	private Locale localeOf(String chatId, String clientLanguage) {
		return links.ownerOf(chatId)
			.map(owner -> owner.getLanguage().locale())
			.orElseGet(() -> clientLocale(clientLanguage));
	}

	private static Locale clientLocale(String clientLanguage) {
		return Language.fromTag(clientLanguage).orElse(Language.DEFAULT).locale();
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
