package io.github.son30kins.workbench.infrastructure.persistence;

import io.github.son30kins.workbench.domain.setting.AppSetting;

import org.springframework.data.jpa.repository.JpaRepository;

interface AppSettingSpringDataRepository extends JpaRepository<AppSetting, String> {

}
