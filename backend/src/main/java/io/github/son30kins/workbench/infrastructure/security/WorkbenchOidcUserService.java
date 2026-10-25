package io.github.son30kins.workbench.infrastructure.security;

import java.util.List;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.application.user.GoogleProfile;
import io.github.son30kins.workbench.application.user.LoginRejectedException;
import io.github.son30kins.workbench.application.user.UserProvisioningService;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Component;

/**
 * Adapter giữa Spring Security và use case đăng nhập: lấy thông tin Google (OidcUser) → chuyển thành
 * {@link GoogleProfile} → gọi {@link UserProvisioningService}. Lỗi nghiệp vụ được đổi thành
 * {@link OAuth2AuthenticationException} kèm mã để trang /login hiển thị.
 */
@Component
@RequiredArgsConstructor
class WorkbenchOidcUserService extends OidcUserService {

	private final UserProvisioningService provisioning;

	@Override
	public OidcUser loadUser(OidcUserRequest request) throws OAuth2AuthenticationException {
		var google = super.loadUser(request);
		var profile = new GoogleProfile(google.getSubject(), google.getEmail(),
				Boolean.TRUE.equals(google.getEmailVerified()), google.getFullName(), google.getPicture());
		try {
			var user = provisioning.provision(profile);
			return new WorkbenchOidcUser(user.getId(), List.of(new SimpleGrantedAuthority(user.getRole().authority())),
					google.getIdToken(), google.getUserInfo());
		}
		catch (LoginRejectedException ex) {
			throw new OAuth2AuthenticationException(new OAuth2Error(ex.code(), ex.getMessage(), null), ex.getMessage());
		}
	}

}
