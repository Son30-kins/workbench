package io.github.son30kins.workbench.infrastructure.security;

import java.io.IOException;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import io.github.son30kins.workbench.domain.user.UserRepository;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Chạy sau khi Spring Security đọc phiên đăng nhập: nạp lại người dùng từ DB.
 * <ul>
 * <li>bị khoá / đã xoá → huỷ phiên, request coi như chưa đăng nhập (401)</li>
 * <li>còn hợp lệ → quyền (ROLE_ADMIN/ROLE_USER) lấy theo DB, nên đổi quyền có hiệu lực ngay</li>
 * </ul>
 * Context mới chỉ dùng cho request này — không ghi lại vào phiên.
 */
class CurrentUserFilter extends OncePerRequestFilter {

	private final UserRepository users;

	CurrentUserFilter(UserRepository users) {
		this.users = users;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		var authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication instanceof OAuth2AuthenticationToken token
				&& token.getPrincipal() instanceof WorkbenchOidcUser principal) {
			var user = users.findById(principal.userId()).filter(u -> !u.isBanned());
			if (user.isEmpty()) {
				SecurityContextHolder.clearContext();
				var session = request.getSession(false);
				if (session != null) {
					session.invalidate();
				}
			}
			else {
				var fresh = new OAuth2AuthenticationToken(principal,
						List.of(new SimpleGrantedAuthority(user.get().getRole().authority())),
						token.getAuthorizedClientRegistrationId());
				var context = SecurityContextHolder.createEmptyContext();
				context.setAuthentication(fresh);
				SecurityContextHolder.setContext(context);
				request.setAttribute(CurrentUser.REQUEST_ATTRIBUTE, CurrentUser.of(user.get()));
			}
		}
		chain.doFilter(request, response);
	}

}
