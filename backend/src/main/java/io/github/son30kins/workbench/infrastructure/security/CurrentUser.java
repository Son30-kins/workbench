package io.github.son30kins.workbench.infrastructure.security;

import java.time.ZoneId;
import java.util.UUID;

import io.github.son30kins.workbench.domain.shared.Language;
import io.github.son30kins.workbench.domain.user.Role;
import io.github.son30kins.workbench.domain.user.User;
import io.github.son30kins.workbench.domain.user.UserContext;
import io.github.son30kins.workbench.domain.user.UserSettings;

/**
 * Người dùng của request hiện tại — đọc lại từ DB ở mỗi request ({@link CurrentUserFilter}) nên quyền
 * và trạng thái khoá luôn mới nhất. Controller nhận bằng cách khai báo tham số kiểu {@code CurrentUser}.
 */
public record CurrentUser(UUID id, String email, String name, String image, Role role, ZoneId zone,
		UserSettings settings, Language language) {

	static final String REQUEST_ATTRIBUTE = CurrentUser.class.getName();

	static CurrentUser of(User user) {
		return new CurrentUser(user.getId(), user.getEmail(), user.getName(), user.getImage(), user.getRole(),
				user.getZone(), user.getEffectiveSettings(), user.getLanguage());
	}

	public UserContext context() {
		return new UserContext(id, zone, settings, language);
	}

}
