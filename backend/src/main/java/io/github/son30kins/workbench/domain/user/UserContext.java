package io.github.son30kins.workbench.domain.user;

import java.time.ZoneId;
import java.util.Locale;
import java.util.UUID;

import io.github.son30kins.workbench.domain.shared.Language;

/**
 * Những gì tầng service cần biết về chủ dữ liệu: id (để lọc), múi giờ, cài đặt nhắc việc và ngôn ngữ.
 * Dùng chung cho request web, job nhắc việc và bot Telegram.
 */
public record UserContext(UUID id, ZoneId zone, UserSettings settings, Language language) {

	public static UserContext of(User user) {
		return user.toContext();
	}

	public Locale locale() {
		return language.locale();
	}

}
