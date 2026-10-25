package io.github.son30kins.workbench.domain.setting;

import java.util.List;
import java.util.Locale;

/**
 * Chính sách đăng nhập của bản cài (value object).
 *
 * @param registrationOpen false = chỉ người đã có tài khoản mới vào được
 */
public record AccessPolicy(List<String> allowedEmails, List<String> allowedDomains, boolean registrationOpen) {

	public AccessPolicy {
		allowedEmails = allowedEmails == null ? List.of() : List.copyOf(allowedEmails);
		allowedDomains = allowedDomains == null ? List.of() : List.copyOf(allowedDomains);
	}

	/** Chưa giới hạn email / tên miền nào → ai cũng vào được. */
	public boolean isEmailAllowed(String email) {
		if (allowedEmails.isEmpty() && allowedDomains.isEmpty()) {
			return true;
		}
		var normalized = email.trim().toLowerCase(Locale.ROOT);
		var domain = normalized.substring(normalized.indexOf('@') + 1);
		return allowedEmails.contains(normalized) || allowedDomains.contains(domain);
	}

}
