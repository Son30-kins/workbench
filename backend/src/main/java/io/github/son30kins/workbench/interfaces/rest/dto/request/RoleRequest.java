package io.github.son30kins.workbench.interfaces.rest.dto.request;

import jakarta.validation.constraints.NotNull;

import io.github.son30kins.workbench.domain.user.Role;

public record RoleRequest(@NotNull Role role) {

}
