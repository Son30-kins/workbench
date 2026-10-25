package io.github.son30kins.workbench.application.user;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.application.config.WorkbenchProperties;
import io.github.son30kins.workbench.application.setting.AppSettingsService;
import io.github.son30kins.workbench.application.template.TemplateService;
import io.github.son30kins.workbench.domain.user.Role;
import io.github.son30kins.workbench.domain.user.User;
import io.github.son30kins.workbench.domain.user.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Sau khi Google xác thực: tìm hoặc tạo người dùng của app, áp dụng chính sách đăng nhập. */
@Service
@RequiredArgsConstructor
public class UserProvisioningService {

	private final UserRepository users;

	private final AppSettingsService appSettings;

	private final TemplateService templates;

	private final WorkbenchProperties properties;

	/** @throws LoginRejectedException khi không được phép đăng nhập */
	@Transactional
	public User provision(GoogleProfile google) {
		if (!google.emailVerified()) {
			throw new LoginRejectedException("EMAIL_NOT_VERIFIED", "Email Google chưa được xác minh");
		}
		var existing = users.findByGoogleSubject(google.subject());
		if (existing.isPresent()) {
			var user = existing.get();
			if (user.isBanned()) {
				throw new LoginRejectedException("ACCOUNT_BANNED", "Tài khoản đã bị khoá");
			}
			user.updateProfile(google.email(), google.displayName(), google.picture());
			return user;
		}

		users.lockForProvisioning();
		boolean firstUser = users.count() == 0;
		var policy = appSettings.accessPolicy();
		if (!firstUser && !policy.registrationOpen()) {
			throw new LoginRejectedException("REGISTRATION_CLOSED", "Bản cài này đã đóng đăng ký");
		}
		if (!policy.isEmailAllowed(google.email())) {
			throw new LoginRejectedException("EMAIL_NOT_ALLOWED", "Email này không được phép đăng nhập");
		}
		if (users.existsByEmail(google.email())) {
			throw new LoginRejectedException("ACCOUNT_CONFLICT", "Email đã gắn với một tài khoản Google khác");
		}

		// Người đăng nhập đầu tiên của bản cài là admin
		var user = users.save(new User(google.subject(), google.email(), google.displayName(), google.picture(),
				firstUser ? Role.ADMIN : Role.USER, properties.defaultTimezone()));
		templates.seedDefaults(user.getId());
		return user;
	}

}
