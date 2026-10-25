package io.github.son30kins.workbench.application.setting;

import java.time.Clock;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import tools.jackson.databind.json.JsonMapper;

import io.github.son30kins.workbench.application.config.WorkbenchProperties;
import io.github.son30kins.workbench.domain.setting.AccessPolicy;
import io.github.son30kins.workbench.domain.setting.AppSetting;
import io.github.son30kins.workbench.domain.setting.AppSettingRepository;
import io.github.son30kins.workbench.domain.setting.TelegramBotInfo;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Cài đặt của cả bản cài: chính sách đăng nhập (admin chỉnh) và thông tin bot Telegram. */
@Service
@RequiredArgsConstructor // Lombok sinh constructor cho các field final → Spring inject qua constructor
public class AppSettingsService {

	private final AppSettingRepository settings;

	private final JsonMapper jsonMapper;

	private final WorkbenchProperties properties;

	private final Clock clock;

	/** Chính sách admin đã lưu; chưa lưu thì lấy từ biến môi trường ALLOWED_EMAILS / ALLOWED_DOMAINS. */
	@Transactional(readOnly = true)
	public AccessPolicy accessPolicy() {
		return read(AppSetting.ACCESS_POLICY, AccessPolicy.class).orElseGet(() -> new AccessPolicy(
				normalize(properties.access().allowedEmails()), normalize(properties.access().allowedDomains()), true));
	}

	@Transactional
	public void saveAccessPolicy(AccessPolicy policy) {
		write(AppSetting.ACCESS_POLICY, policy);
	}

	@Transactional(readOnly = true)
	public Optional<String> telegramBotUsername() {
		return read(AppSetting.TELEGRAM_BOT, TelegramBotInfo.class).map(TelegramBotInfo::username);
	}

	@Transactional
	public void saveTelegramBot(String username) {
		write(AppSetting.TELEGRAM_BOT, new TelegramBotInfo(username, clock.instant()));
	}

	private <T> Optional<T> read(String key, Class<T> type) {
		return settings.findByKey(key).map(setting -> jsonMapper.readValue(setting.getValue(), type));
	}

	private void write(String key, Object value) {
		var json = jsonMapper.writeValueAsString(value);
		settings.findByKey(key)
			.ifPresentOrElse(setting -> setting.replace(json), () -> settings.save(new AppSetting(key, json)));
	}

	private static List<String> normalize(List<String> values) {
		return values.stream().map(v -> v.trim().toLowerCase(Locale.ROOT)).filter(v -> !v.isEmpty()).toList();
	}

}
