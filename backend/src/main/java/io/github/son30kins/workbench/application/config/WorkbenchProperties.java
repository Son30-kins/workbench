package io.github.son30kins.workbench.application.config;

import java.net.URI;
import java.time.Duration;
import java.time.ZoneId;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Cấu hình riêng của app (tiền tố {@code workbench.*} trong application.yml).
 * Record + {@code @ConfigurationProperties}: Spring tự bind và kiểm tra kiểu lúc khởi động.
 */
@ConfigurationProperties("workbench")
public record WorkbenchProperties(
		@DefaultValue("http://localhost:3000") URI appUrl,
		@DefaultValue("Asia/Ho_Chi_Minh") ZoneId defaultTimezone,
		@DefaultValue Access access,
		@DefaultValue Telegram telegram,
		@DefaultValue Jobs jobs) {

	/** Danh sách email / tên miền được phép đăng nhập khi admin chưa lưu chính sách trong app. */
	public record Access(@DefaultValue List<String> allowedEmails, @DefaultValue List<String> allowedDomains) {
	}

	public record Telegram(String botToken) {

		public boolean enabled() {
			return botToken != null && !botToken.isBlank();
		}

		/** Không bao giờ in token ra log. */
		@Override
		public String toString() {
			return "Telegram[botToken=" + (enabled() ? "***" : "<chưa cấu hình>") + "]";
		}
	}

	/** Job nhắc việc / bản tin chạy mỗi {@code tick}. Tắt trong test. */
	public record Jobs(@DefaultValue("true") boolean enabled, @DefaultValue("30s") Duration tick) {
	}

	/** URL gốc của app, không có dấu / ở cuối. */
	public String appBaseUrl() {
		var url = appUrl.toString();
		return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
	}

}
