package io.github.son30kins.workbench.infrastructure.security;

import java.io.Serial;
import java.util.Collection;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;

/**
 * Principal lưu trong phiên đăng nhập: thông tin Google + id người dùng của app.
 * {@link #getName()} trả về id của app → Spring Session ghi vào cột PRINCIPAL_NAME, nhờ đó
 * đăng xuất được mọi thiết bị của một người dùng ({@link SessionRevoker}).
 */
public class WorkbenchOidcUser extends DefaultOidcUser {

	@Serial
	private static final long serialVersionUID = 1L;

	private final UUID userId;

	WorkbenchOidcUser(UUID userId, Collection<? extends GrantedAuthority> authorities, OidcIdToken idToken,
			OidcUserInfo userInfo) {
		super(authorities, idToken, userInfo);
		this.userId = userId;
	}

	public UUID userId() {
		return userId;
	}

	@Override
	public String getName() {
		return userId.toString();
	}

}
