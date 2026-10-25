package io.github.son30kins.workbench.domain.shared;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Lưu {@link Language} bằng mã "vi" / "en" / "de" (khớp CHECK trong database). */
@Converter(autoApply = true)
public class LanguageConverter implements AttributeConverter<Language, String> {

	@Override
	public String convertToDatabaseColumn(Language language) {
		return language == null ? null : language.tag();
	}

	@Override
	public Language convertToEntityAttribute(String tag) {
		return Language.fromTag(tag).orElse(Language.DEFAULT);
	}

}
