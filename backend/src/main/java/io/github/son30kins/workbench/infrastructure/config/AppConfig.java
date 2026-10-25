package io.github.son30kins.workbench.infrastructure.config;

import java.time.Clock;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration(proxyBeanMethods = false)
public class AppConfig {

	/** Mọi chỗ cần "bây giờ" đều lấy từ Clock → test thay được bằng Clock.fixed(). */
	@Bean
	Clock clock() {
		return Clock.systemUTC();
	}

	@Bean
	OpenAPI workbenchOpenApi() {
		return new OpenAPI().info(new Info().title("Workbench API")
			.description("REST API của Workbench — app quản lý task tự host")
			.license(new License().name("MIT")));
	}

	/** Bật @Scheduled (job nhắc việc, bản tin). Test đặt workbench.jobs.enabled=false để tắt. */
	@Configuration(proxyBeanMethods = false)
	@EnableScheduling
	@ConditionalOnBooleanProperty(name = "workbench.jobs.enabled", matchIfMissing = true)
	static class SchedulingConfig {

	}

}
