package io.github.son30kins.workbench.application.i18n;

import java.util.Locale;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.domain.shared.Translatable;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

/**
 * Dịch mã thông điệp sang câu chữ ({@code resources/messages*.properties}). Trong request web, ngôn ngữ lấy từ
 * {@link LocaleContextHolder} (cookie / Accept-Language); job nền và bot Telegram truyền ngôn ngữ của người nhận.
 * Mã không có trong file → trả lại chính mã đó (dễ thấy khi quên dịch).
 */
@Component
@RequiredArgsConstructor
public class Translator {

	private final MessageSource messageSource;

	public String get(Locale locale, String code, Object... args) {
		return messageSource.getMessage(code, args, code, locale);
	}

	public String get(Locale locale, Translatable message) {
		return get(locale, message.code(), message.argsArray());
	}

	/** Theo ngôn ngữ của request hiện tại. */
	public String get(String code, Object... args) {
		return get(LocaleContextHolder.getLocale(), code, args);
	}

	public String get(Translatable message) {
		return get(LocaleContextHolder.getLocale(), message);
	}

}
