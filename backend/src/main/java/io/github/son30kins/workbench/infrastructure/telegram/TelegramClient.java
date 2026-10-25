package io.github.son30kins.workbench.infrastructure.telegram;

import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import io.github.son30kins.workbench.application.config.WorkbenchProperties;
import io.github.son30kins.workbench.application.port.TelegramGateway;

import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

/**
 * Hiện thực port {@link TelegramGateway}: tạo client {@link TelegramApi} từ RestClient của Spring Boot, thêm nút
 * bấm và làm sạch lỗi. Token nằm trong URL nên thông điệp lỗi I/O có thể chứa nó → luôn qua {@link #safeMessage}.
 */
@Component
class TelegramClient implements TelegramGateway {

	/** Long polling: Telegram giữ kết nối tối đa 25 giây → read timeout phải dài hơn. */
	static final int POLL_TIMEOUT_SECONDS = 25;

	private final TelegramApi api;

	private final String token;

	private final String appUrl;

	TelegramClient(WorkbenchProperties properties, RestClient.Builder restClientBuilder) {
		this.token = properties.telegram().enabled() ? properties.telegram().botToken().trim() : null;
		this.appUrl = properties.appBaseUrl();
		if (token == null) {
			this.api = null;
			return;
		}
		var requestFactory = new JdkClientHttpRequestFactory(
				HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build());
		requestFactory.setReadTimeout(Duration.ofSeconds(POLL_TIMEOUT_SECONDS + 15));
		var restClient = restClientBuilder.clone()
			.baseUrl("https://api.telegram.org/bot" + token)
			.requestFactory(requestFactory)
			.build();
		this.api = HttpServiceProxyFactory.builderFor(RestClientAdapter.create(restClient))
			.build()
			.createClient(TelegramApi.class);
	}

	@Override
	public boolean enabled() {
		return api != null;
	}

	TelegramApi api() {
		if (api == null) {
			throw new IllegalStateException("Chưa cấu hình TELEGRAM_BOT_TOKEN");
		}
		return api;
	}

	@Override
	public void sendHtml(String chatId, String html, String taskId) {
		try {
			var response = api().sendMessage(new TelegramApi.SendMessage(chatId, html, "HTML",
					new TelegramApi.LinkPreviewOptions(true), taskId == null ? null : taskKeyboard(taskId)));
			if (!response.ok()) {
				throw new TelegramException("Telegram từ chối tin nhắn: " + response.description());
			}
		}
		catch (TelegramException ex) {
			throw ex;
		}
		catch (RuntimeException ex) {
			throw new TelegramException(safeMessage(ex));
		}
	}

	private TelegramApi.InlineKeyboardMarkup taskKeyboard(String taskId) {
		var rows = new ArrayList<List<TelegramApi.InlineKeyboardButton>>();
		rows.add(List.of(new TelegramApi.InlineKeyboardButton("✅ Xong", "done:" + taskId, null),
				new TelegramApi.InlineKeyboardButton("⏰ 1 giờ", "s1h:" + taskId, null),
				new TelegramApi.InlineKeyboardButton("📅 Mai", "stm:" + taskId, null)));
		if (isPublicUrl(appUrl)) {
			rows.add(List.of(new TelegramApi.InlineKeyboardButton("🔗 Mở trong app", null, appUrl + "/?task=" + taskId)));
		}
		return new TelegramApi.InlineKeyboardMarkup(rows);
	}

	/** Thông điệp lỗi đã xoá token. */
	String safeMessage(Throwable ex) {
		var message = String.valueOf(ex.getMessage());
		return token == null ? message : message.replace(token, "***");
	}

	/** Telegram từ chối nút URL trỏ tới localhost / IP nội bộ. */
	static boolean isPublicUrl(String url) {
		try {
			var uri = URI.create(url);
			var host = uri.getHost();
			if (host == null || !("https".equals(uri.getScheme()) || "http".equals(uri.getScheme()))) {
				return false;
			}
			if (host.equals("localhost") || host.endsWith(".local")) {
				return false;
			}
			return !host.matches("^(\\d+\\.){3}\\d+$") && !host.contains(":");
		}
		catch (IllegalArgumentException ex) {
			return false;
		}
	}

}
