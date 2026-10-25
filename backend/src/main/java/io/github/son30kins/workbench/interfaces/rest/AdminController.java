package io.github.son30kins.workbench.interfaces.rest;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.application.admin.AdminService;
import io.github.son30kins.workbench.application.setting.AppSettingsService;
import io.github.son30kins.workbench.application.telegram.TelegramNotificationService;
import io.github.son30kins.workbench.domain.setting.AccessPolicy;
import io.github.son30kins.workbench.domain.shared.DomainException;
import io.github.son30kins.workbench.infrastructure.security.CurrentUser;
import io.github.son30kins.workbench.interfaces.rest.dto.request.AccessPolicyRequest;
import io.github.son30kins.workbench.interfaces.rest.dto.request.BannedRequest;
import io.github.son30kins.workbench.interfaces.rest.dto.request.RoleRequest;
import io.github.son30kins.workbench.interfaces.rest.dto.response.AdminStatusResponse;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** /api/admin/** — SecurityConfig chỉ cho ROLE_ADMIN vào. */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
class AdminController {

	private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$");

	private static final Pattern DOMAIN = Pattern.compile("^[a-z0-9.-]+\\.[a-z]{2,}$");

	private final AdminService admin;

	private final AppSettingsService appSettings;

	private final TelegramNotificationService telegram;

	@GetMapping("/status")
	AdminStatusResponse status() {
		return new AdminStatusResponse(telegram.botConfigured(), appSettings.telegramBotUsername().orElse(null));
	}

	@GetMapping("/users")
	List<AdminService.AdminUser> users() {
		return admin.listUsers();
	}

	@PatchMapping("/users/{id}/banned")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void setBanned(CurrentUser user, @PathVariable UUID id, @RequestBody BannedRequest request) {
		admin.setBanned(user.id(), id, request.banned());
	}

	@PatchMapping("/users/{id}/role")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void setRole(CurrentUser user, @PathVariable UUID id, @Valid @RequestBody RoleRequest request) {
		admin.setRole(user.id(), id, request.role());
	}

	@GetMapping("/access-policy")
	AccessPolicy accessPolicy() {
		return appSettings.accessPolicy();
	}

	/** Chuẩn hoá (chữ thường, bỏ trùng, bỏ @ đầu tên miền) rồi kiểm tra từng email / tên miền. */
	@PutMapping("/access-policy")
	AccessPolicy saveAccessPolicy(@RequestBody AccessPolicyRequest request) {
		var emails = normalize(request.allowedEmails());
		var domains = normalize(request.allowedDomains()).stream().map(d -> d.replaceFirst("^@", "")).toList();
		for (var email : emails) {
			if (!EMAIL.matcher(email).matches()) {
				throw new DomainException("Email không hợp lệ: " + email);
			}
		}
		for (var domain : domains) {
			if (!DOMAIN.matcher(domain).matches()) {
				throw new DomainException("Tên miền không hợp lệ: " + domain);
			}
		}
		var policy = new AccessPolicy(emails, domains, request.registrationOpen());
		appSettings.saveAccessPolicy(policy);
		return policy;
	}

	private static List<String> normalize(List<String> values) {
		var result = new LinkedHashSet<String>();
		for (var value : values) {
			var v = value.trim().toLowerCase(Locale.ROOT);
			if (!v.isEmpty()) {
				result.add(v);
			}
		}
		return new ArrayList<>(result);
	}

}
