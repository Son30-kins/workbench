package io.github.son30kins.workbench.application.telegram;

import java.util.UUID;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.application.port.TelegramGateway;

import org.springframework.stereotype.Service;

/** Gửi tin tới Telegram của một người dùng (nếu bot đã cấu hình và người dùng đã liên kết). */
@Service
@RequiredArgsConstructor
public class TelegramNotificationService {

	private final TelegramGateway telegram;

	private final TelegramLinkService links;

	public boolean botConfigured() {
		return telegram.enabled();
	}

	/**
	 * @return true nếu đã gửi; false nếu bot chưa cấu hình hoặc người dùng chưa liên kết
	 * @throws TelegramGateway.TelegramException khi Telegram báo lỗi
	 */
	public boolean sendTo(UUID userId, String html, UUID taskId) {
		if (!telegram.enabled()) {
			return false;
		}
		return links.chatOf(userId).map(chatId -> {
			telegram.sendHtml(chatId, html, taskId == null ? null : taskId.toString());
			return true;
		}).orElse(false);
	}

}
