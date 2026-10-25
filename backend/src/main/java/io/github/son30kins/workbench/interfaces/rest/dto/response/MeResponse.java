package io.github.son30kins.workbench.interfaces.rest.dto.response;

import java.util.UUID;

import io.github.son30kins.workbench.domain.shared.Language;
import io.github.son30kins.workbench.domain.user.Role;
import io.github.son30kins.workbench.domain.user.User;
import io.github.son30kins.workbench.domain.user.UserSettings;
import io.github.son30kins.workbench.infrastructure.security.CurrentUser;

public record MeResponse(UUID id, String name, String email, String image, Role role, String timezone,
		UserSettings settings, Language language) {

	public static MeResponse from(CurrentUser user) {
		return new MeResponse(user.id(), user.name(), user.email(), user.image(), user.role(), user.zone().getId(),
				user.settings(), user.language());
	}

	public static MeResponse from(User user) {
		return new MeResponse(user.getId(), user.getName(), user.getEmail(), user.getImage(), user.getRole(),
				user.getZone().getId(), user.getEffectiveSettings(), user.getLanguage());
	}

}
