package io.github.son30kins.workbench.infrastructure.persistence;

import java.util.Optional;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.domain.setting.AppSetting;
import io.github.son30kins.workbench.domain.setting.AppSettingRepository;

import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
class AppSettingRepositoryAdapter implements AppSettingRepository {

	private final AppSettingSpringDataRepository jpa;

	@Override
	public Optional<AppSetting> findByKey(String key) {
		return jpa.findById(key);
	}

	@Override
	public AppSetting save(AppSetting setting) {
		return jpa.save(setting);
	}

}
