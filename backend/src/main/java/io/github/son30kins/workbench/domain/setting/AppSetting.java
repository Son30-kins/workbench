package io.github.son30kins.workbench.domain.setting;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

/** Một cặp key → JSON của cả bản cài (bảng {@code app_settings}). */
@Entity
@Table(name = "app_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AppSetting {

	public static final String ACCESS_POLICY = "access_policy";

	public static final String TELEGRAM_BOT = "telegram_bot";

	@Id
	private String key;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	private String value;

	@UpdateTimestamp
	private Instant updatedAt;

	public AppSetting(String key, String json) {
		this.key = key;
		this.value = json;
	}

	public void replace(String json) {
		this.value = json;
	}

}
