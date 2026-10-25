package io.github.son30kins.workbench.interfaces.rest;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.application.user.UserService;
import io.github.son30kins.workbench.infrastructure.security.CurrentUser;
import io.github.son30kins.workbench.interfaces.rest.dto.request.PreferencesRequest;
import io.github.son30kins.workbench.interfaces.rest.dto.response.MeResponse;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Thông tin và cài đặt của người dùng đang đăng nhập. */
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
class MeController {

	private final UserService users;

	@GetMapping
	MeResponse me(CurrentUser user) {
		return MeResponse.from(user);
	}

	@PutMapping("/preferences")
	MeResponse updatePreferences(CurrentUser user, @Valid @RequestBody PreferencesRequest request) {
		return MeResponse.from(users.updatePreferences(user.id(), request.timezone(), request.settings()));
	}

}
