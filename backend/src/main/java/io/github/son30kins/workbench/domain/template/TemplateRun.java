package io.github.son30kins.workbench.domain.template;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Một lần điền form mẫu — lưu lại giá trị đã điền và số task đã tạo. */
@Entity
@Table(name = "template_runs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TemplateRun {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	private UUID userId;

	private UUID templateId;

	private String templateName;

	@JdbcTypeCode(SqlTypes.JSON)
	private Map<String, Object> formValues = new LinkedHashMap<>();

	private int taskCount;

	@CreationTimestamp
	private Instant createdAt;

	public TemplateRun(Template template, Map<String, Object> formValues, int taskCount) {
		this.userId = template.getUserId();
		this.templateId = template.getId();
		this.templateName = template.getName();
		this.formValues = new LinkedHashMap<>(formValues);
		this.taskCount = taskCount;
	}

}
