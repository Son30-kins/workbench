package io.github.son30kins.workbench.infrastructure.config;

import java.util.Arrays;
import java.util.Locale;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import io.github.son30kins.workbench.domain.shared.Language;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.LocaleResolver;

/**
 * Ngôn ngữ của request: cookie {@code WORKBENCH_LANG} (web đặt khi người dùng chọn) → header
 * {@code Accept-Language} (web gửi kèm mỗi lần gọi API; trình duyệt gửi khi đăng nhập) → tiếng Việt. Chỉ trả về
 * ngôn ngữ app hỗ trợ.
 */
@Configuration(proxyBeanMethods = false)
class LocaleConfig {

	static final String COOKIE = "WORKBENCH_LANG";

	/** Tên bean phải là "localeResolver" để DispatcherServlet dùng. */
	@Bean
	LocaleResolver localeResolver() {
		return new WorkbenchLocaleResolver();
	}

	static final class WorkbenchLocaleResolver implements LocaleResolver {

		@Override
		public Locale resolveLocale(HttpServletRequest request) {
			return language(request).locale();
		}

		@Override
		public void setLocale(HttpServletRequest request, HttpServletResponse response, Locale locale) {
			throw new UnsupportedOperationException("Ngôn ngữ đổi qua PUT /api/me/language");
		}

		static Language language(HttpServletRequest request) {
			var cookies = request.getCookies() == null ? new Cookie[0] : request.getCookies();
			var fromCookie = Arrays.stream(cookies)
				.filter(c -> COOKIE.equals(c.getName()))
				.findFirst()
				.flatMap(c -> Language.fromTag(c.getValue()));
			if (fromCookie.isPresent()) {
				return fromCookie.get();
			}
			var header = request.getHeader("Accept-Language");
			if (header != null && !header.isBlank()) {
				try {
					for (var range : Locale.LanguageRange.parse(header)) {
						var match = Language.fromTag(range.getRange());
						if (match.isPresent()) {
							return match.get();
						}
					}
				}
				catch (IllegalArgumentException ex) {
					// header sai cú pháp → dùng mặc định
				}
			}
			return Language.DEFAULT;
		}

	}

}
