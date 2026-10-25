package io.github.son30kins.workbench.application.port;

import java.util.Locale;

/**
 * Port ra ngoài: gửi tin Telegram. Tầng application chỉ biết interface này; hiện thực ở
 * {@code infrastructure.telegram.TelegramClient} (gọi Telegram Bot API qua HTTP).
 */
public interface TelegramGateway {

	/** Bản cài đã có TELEGRAM_BOT_TOKEN chưa. */
	boolean enabled();

	/**
	 * Gửi tin HTML; nếu có {@code taskId} thì kèm nút Xong / Hoãn / Mở trong app (chữ trên nút theo {@code locale}).
	 * @throws TelegramException khi Telegram báo lỗi (thông điệp không chứa token)
	 */
	void sendHtml(String chatId, String html, String taskId, Locale locale);

	class TelegramException extends RuntimeException {

		public TelegramException(String message) {
			super(message);
		}

	}

}
