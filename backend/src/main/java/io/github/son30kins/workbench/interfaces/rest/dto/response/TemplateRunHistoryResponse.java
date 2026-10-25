package io.github.son30kins.workbench.interfaces.rest.dto.response;

import java.time.Instant;
import java.util.UUID;

import io.github.son30kins.workbench.domain.template.TemplateRun;

public record TemplateRunHistoryResponse(UUID id, UUID templateId, String templateName, int taskCount,
		Instant createdAt) {

	public static TemplateRunHistoryResponse from(TemplateRun r) {
		return new TemplateRunHistoryResponse(r.getId(), r.getTemplateId(), r.getTemplateName(), r.getTaskCount(),
				r.getCreatedAt());
	}

}
