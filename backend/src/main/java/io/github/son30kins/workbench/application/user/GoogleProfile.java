package io.github.son30kins.workbench.application.user;

/**
 * Thông tin Google trả về sau khi đăng nhập — record thuần, không phụ thuộc Spring Security.
 * Adapter bảo mật (infrastructure) chuyển OidcUser thành record này.
 */
public record GoogleProfile(String subject, String email, boolean emailVerified, String name, String picture) {

	public String displayName() {
		return name == null || name.isBlank() ? email : name;
	}

}
