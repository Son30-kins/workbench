package io.github.son30kins.workbench.domain.setting;

import java.time.Instant;

/** Tên bot Telegram — bot ghi lại khi kết nối; {@code username} null = có token nhưng không kết nối được. */
public record TelegramBotInfo(String username, Instant updatedAt) {

}
