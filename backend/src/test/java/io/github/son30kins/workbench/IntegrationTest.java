package io.github.son30kins.workbench;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

/**
 * Test tích hợp: khởi động toàn bộ app với Postgres (Testcontainers).
 * Tắt job định kỳ và bot Telegram để test chủ động gọi khi cần, không phụ thuộc .env.local của máy dev.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(properties = { "workbench.jobs.enabled=false", "workbench.telegram.bot-token=",
		"workbench.app-url=http://localhost:3000" })
@Import({ TestcontainersConfiguration.class, TestFixtures.class })
public @interface IntegrationTest {

}
