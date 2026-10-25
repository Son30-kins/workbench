package io.github.son30kins.workbench.infrastructure.security;

import java.io.IOException;
import java.util.Set;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Chống CSRF bằng header tự đặt (OWASP "custom request header"): mọi request thay đổi dữ liệu tới /api
 * phải có {@code X-Requested-By}. Trang web độc hại không gửi được header này sang domain khác nếu không
 * qua CORS preflight — mà API không bật CORS. Web (Next.js) gọi API từ phía server nên luôn gửi kèm.
 */
class RequestedByFilter extends OncePerRequestFilter {

	static final String HEADER = "X-Requested-By";

	private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS");

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		return !request.getRequestURI().startsWith("/api/") || SAFE_METHODS.contains(request.getMethod());
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		var value = request.getHeader(HEADER);
		if (value == null || value.isBlank()) {
			response.setStatus(HttpStatus.FORBIDDEN.value());
			response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
			response.setCharacterEncoding("UTF-8");
			response.getWriter().write("{\"status\":403,\"detail\":\"Thiếu header " + HEADER + "\"}");
			return;
		}
		chain.doFilter(request, response);
	}

}
