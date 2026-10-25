package io.github.son30kins.workbench.domain.setting;

import java.util.Optional;

public interface AppSettingRepository {

	Optional<AppSetting> findByKey(String key);

	AppSetting save(AppSetting setting);

}
