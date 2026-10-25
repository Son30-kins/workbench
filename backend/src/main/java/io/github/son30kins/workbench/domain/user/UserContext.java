package io.github.son30kins.workbench.domain.user;

import java.time.ZoneId;
import java.util.UUID;

/**
 * Những gì tầng service cần biết về chủ dữ liệu: id (để lọc), múi giờ và cài đặt nhắc việc.
 * Dùng chung cho request web, job nhắc việc và bot Telegram.
 */
public record UserContext(UUID id, ZoneId zone, UserSettings settings) {

	public static UserContext of(User user) {
		return new UserContext(user.getId(), user.getZone(), user.getEffectiveSettings());
	}

}
