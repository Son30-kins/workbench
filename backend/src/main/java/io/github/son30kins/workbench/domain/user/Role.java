package io.github.son30kins.workbench.domain.user;

public enum Role {

	ADMIN, USER;

	/** Tên authority theo quy ước Spring Security: hasRole("ADMIN") ↔ "ROLE_ADMIN". */
	public String authority() {
		return "ROLE_" + name();
	}

}
