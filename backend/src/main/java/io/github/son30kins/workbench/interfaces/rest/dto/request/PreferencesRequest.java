package io.github.son30kins.workbench.interfaces.rest.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import io.github.son30kins.workbench.domain.user.UserSettings;

public record PreferencesRequest(@NotBlank String timezone, @NotNull @Valid UserSettings settings) {

}
