package io.github.son30kins.workbench.interfaces.rest.dto.request;

import jakarta.validation.constraints.NotNull;

import io.github.son30kins.workbench.domain.shared.Language;

/** Body của PUT /api/me/language: {"language": "vi" | "en" | "de"}. */
public record LanguageRequest(@NotNull Language language) {

}
