package io.github.son30kins.workbench.application.user;

/** Từ chối đăng nhập; {@code code} (REGISTRATION_CLOSED…) được trang /login dùng để hiện thông báo. */
public class LoginRejectedException extends RuntimeException {

	private final String code;

	public LoginRejectedException(String code, String message) {
		super(message);
		this.code = code;
	}

	public String code() {
		return code;
	}

}
