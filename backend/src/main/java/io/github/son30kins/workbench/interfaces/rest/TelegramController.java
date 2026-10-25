package io.github.son30kins.workbench.interfaces.rest;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.application.notification.MessageFormatter;
import io.github.son30kins.workbench.application.port.TelegramGateway;
import io.github.son30kins.workbench.application.setting.AppSettingsService;
import io.github.son30kins.workbench.application.telegram.TelegramLinkService;
import io.github.son30kins.workbench.application.telegram.TelegramNotificationService;
import io.github.son30kins.workbench.domain.shared.DomainException;
import io.github.son30kins.workbench.infrastructure.security.CurrentUser;
import io.github.son30kins.workbench.interfaces.rest.dto.response.LinkResponse;
import io.github.son30kins.workbench.interfaces.rest.dto.response.MessageResponse;
import io.github.son30kins.workbench.interfaces.rest.dto.response.TelegramStatusResponse;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Kết nối Telegram của người dùng đang đăng nhập. */
@RestController
@RequestMapping("/api/telegram")
@RequiredArgsConstructor
class TelegramController {

	private final TelegramLinkService links;

	private final TelegramNotificationService notifier;

	private final AppSettingsService appSettings;

	@GetMapping
	TelegramStatusResponse status(CurrentUser user) {
		var channel = links.status(user.id());
		return new TelegramStatusResponse(notifier.botConfigured(), appSettings.telegramBotUsername().orElse(null),
				channel.linked(), channel.username());
	}

	/** Tạo link t.me/&lt;bot&gt;?start=&lt;mã&gt; để người dùng bấm Start trong Telegram. */
	@PostMapping("/link")
	LinkResponse createLink(CurrentUser user) {
		if (!notifier.botConfigured()) {
			throw new DomainException("Bản cài này chưa cấu hình Telegram bot. Báo admin thêm TELEGRAM_BOT_TOKEN vào .env.");
		}
		var bot = appSettings.telegramBotUsername()
			.orElseThrow(() -> new DomainException("Không kết nối được bot Telegram. Kiểm tra lại token."));
		return new LinkResponse("https://t.me/" + bot + "?start=" + links.createLinkToken(user.id()));
	}

	@DeleteMapping("/link")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void unlink(CurrentUser user) {
		links.unlink(user.id());
	}

	@PostMapping("/test")
	MessageResponse sendTest(CurrentUser user) {
		var html = "🔔 <b>Tin nhắn thử</b>\nTài khoản <i>%s</i> sẽ nhận nhắc việc tại đây."
			.formatted(MessageFormatter.escapeHtml(user.email()));
		boolean sent;
		try {
			sent = notifier.sendTo(user.id(), html, null);
		}
		catch (TelegramGateway.TelegramException ex) {
			throw new DomainException("Gửi thất bại");
		}
		if (!sent) {
			throw new DomainException("Chưa kết nối Telegram");
		}
		return new MessageResponse("Đã gửi — kiểm tra Telegram");
	}

}
