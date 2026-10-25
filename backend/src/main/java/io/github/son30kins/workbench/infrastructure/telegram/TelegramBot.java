package io.github.son30kins.workbench.infrastructure.telegram;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import io.github.son30kins.workbench.application.notification.MessageFormatter;
import io.github.son30kins.workbench.application.setting.AppSettingsService;
import io.github.son30kins.workbench.application.telegram.TelegramCommandService;

import org.springframework.context.SmartLifecycle;
import org.springframework.stereotype.Component;

/**
 * Adapter đầu vào: bot Telegram chạy kiểu long polling (không cần tên miền public). Một virtual thread gọi
 * getUpdates liên tục, chuyển lệnh / nút bấm cho {@link TelegramCommandService} rồi gửi trả lời.
 * {@link SmartLifecycle}: Spring tự gọi start() khi app khởi động xong và stop() khi tắt.
 */
@Slf4j
@Component
@RequiredArgsConstructor
class TelegramBot implements SmartLifecycle {

	private final TelegramClient client;

	private final TelegramCommandService commands;

	private final AppSettingsService appSettings;

	private volatile boolean running;

	private Thread worker;

	@Override
	public void start() {
		if (!client.enabled()) {
			log.warn("⚠ Chưa có TELEGRAM_BOT_TOKEN — nhắc việc chỉ hiện trong app (chuông thông báo).");
			return;
		}
		running = true;
		worker = Thread.ofVirtual().name("telegram-bot").start(this::run);
	}

	@Override
	public void stop() {
		running = false;
		if (worker != null) {
			worker.interrupt();
		}
	}

	@Override
	public boolean isRunning() {
		return running;
	}

	private void run() {
		connect();
		long offset = 0;
		while (running) {
			try {
				var response = client.api()
					.getUpdates(new TelegramApi.GetUpdates(offset, TelegramClient.POLL_TIMEOUT_SECONDS,
							List.of("message", "callback_query")));
				for (var update : Optional.ofNullable(response.result()).orElse(List.of())) {
					offset = update.updateId() + 1;
					handleSafely(update);
				}
			}
			catch (RuntimeException ex) {
				if (!running) {
					return;
				}
				log.warn("Lỗi nhận tin Telegram, thử lại sau 5 giây: {}", client.safeMessage(ex));
				sleep(Duration.ofSeconds(5));
			}
		}
	}

	/** getMe → lưu tên bot (trang Cài đặt cần để tạo link t.me/&lt;bot&gt;). Thử lại tới khi được. */
	private void connect() {
		while (running) {
			try {
				var me = client.api().getMe();
				if (me.ok() && me.result() != null) {
					appSettings.saveTelegramBot(me.result().username());
					client.api()
						.setMyCommands(new TelegramApi.SetMyCommands(
								List.of(new TelegramApi.BotCommand("today", "Việc hôm nay và quá hạn"),
										new TelegramApi.BotCommand("help", "Hướng dẫn"))));
					log.info("✓ Telegram bot @{} đã kết nối", me.result().username());
					return;
				}
				log.error("✋ Telegram từ chối token: {}", me.description());
			}
			catch (RuntimeException ex) {
				log.error("✋ Không kết nối được Telegram bot — kiểm tra TELEGRAM_BOT_TOKEN: {}", client.safeMessage(ex));
			}
			appSettings.saveTelegramBot(null);
			sleep(Duration.ofSeconds(30));
		}
	}

	private void handleSafely(TelegramApi.Update update) {
		try {
			if (update.message() != null && update.message().text() != null) {
				handleMessage(update.message());
			}
			else if (update.callbackQuery() != null) {
				handleButton(update.callbackQuery());
			}
		}
		catch (RuntimeException ex) {
			log.error("Lỗi xử lý tin nhắn Telegram: {}", client.safeMessage(ex));
		}
	}

	private void handleMessage(TelegramApi.Message message) {
		var chatId = String.valueOf(message.chat().id());
		var text = message.text().trim();
		var space = text.indexOf(' ');
		var command = (space < 0 ? text : text.substring(0, space)).split("@")[0]; // "/today@tenbot" → "/today"
		var argument = space < 0 ? "" : text.substring(space + 1);

		var reply = switch (command) {
			case "/start" -> commands.start(argument, chatId, message.from() == null ? null : message.from().username());
			case "/help" -> commands.help();
			case "/today" -> commands.today(chatId);
			default -> null; // bỏ qua tin nhắn thường
		};
		if (reply != null) {
			client.sendHtml(chatId, reply, null);
		}
	}

	private void handleButton(TelegramApi.CallbackQuery callback) {
		var chatId = String.valueOf(callback.message() != null ? callback.message().chat().id() : callback.from().id());
		var result = commands.button(chatId, String.valueOf(callback.data()));
		client.api()
			.answerCallbackQuery(new TelegramApi.AnswerCallbackQuery(callback.id(), result.answer(),
					result.alert() ? true : null));
		if (result.markDone() && callback.message() != null) {
			markDone(chatId, callback.message());
		}
	}

	/** Sửa tin nhắc thành "✅ Đã xong"; không sửa được nội dung thì ít nhất gỡ các nút. */
	private void markDone(String chatId, TelegramApi.Message message) {
		var original = MessageFormatter.escapeHtml(message.text());
		try {
			client.api()
				.editMessageText(new TelegramApi.EditMessageText(chatId, message.messageId(),
						original + "\n\n✅ <b>Đã xong</b>", "HTML"));
		}
		catch (RuntimeException ex) {
			try {
				client.api().editMessageReplyMarkup(new TelegramApi.EditMessageReplyMarkup(chatId, message.messageId()));
			}
			catch (RuntimeException ignored) {
				// tin cũ không sửa được thì thôi
			}
		}
	}

	private static void sleep(Duration duration) {
		try {
			Thread.sleep(duration);
		}
		catch (InterruptedException ex) {
			Thread.currentThread().interrupt();
		}
	}

}
