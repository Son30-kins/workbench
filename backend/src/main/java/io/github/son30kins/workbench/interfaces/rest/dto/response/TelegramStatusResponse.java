package io.github.son30kins.workbench.interfaces.rest.dto.response;

public record TelegramStatusResponse(boolean botConfigured, String botUsername, boolean linked, String username) {

}
