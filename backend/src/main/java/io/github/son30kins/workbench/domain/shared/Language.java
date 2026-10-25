package io.github.son30kins.workbench.domain.shared;

import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Ngôn ngữ giao diện / tin nhắn. Lưu và trao đổi bằng mã ngắn: "vi", "en", "de". */
public enum Language {

	VI("vi"), EN("en"), DE("de");

	public static final Language DEFAULT = VI;

	private final String tag;

	private final Locale locale;

	Language(String tag) {
		this.tag = tag;
		this.locale = Locale.forLanguageTag(tag);
	}

	@JsonValue
	public String tag() {
		return tag;
	}

	public Locale locale() {
		return locale;
	}

	/** "de", "de-AT", "EN" → ngôn ngữ tương ứng; mã lạ → rỗng. */
	public static Optional<Language> fromTag(String value) {
		if (value == null || value.isBlank()) {
			return Optional.empty();
		}
		var primary = Locale.forLanguageTag(value.trim().replace('_', '-')).getLanguage();
		return Arrays.stream(values()).filter(l -> l.tag.equals(primary)).findFirst();
	}

	public static Language of(Locale locale) {
		return locale == null ? DEFAULT : fromTag(locale.toLanguageTag()).orElse(DEFAULT);
	}

	@JsonCreator
	static Language parse(String value) {
		return fromTag(value).orElseThrow(() -> new IllegalArgumentException("Unsupported language: " + value));
	}

}
