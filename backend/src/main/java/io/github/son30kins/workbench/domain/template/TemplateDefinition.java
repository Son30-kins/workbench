package io.github.son30kins.workbench.domain.template;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Nội dung của một form mẫu — vừa là body của API tạo/sửa, vừa dùng cho bộ form mặc định.
 * Bean Validation kiểm tra từng trường; {@link TemplateValidator} kiểm tra liên trường.
 */
public record TemplateDefinition(
		@NotBlank(message = "{validation.template.name}") @Size(max = 100) String name,
		@Size(max = 1000) String description,
		@NotNull @Size(max = 30) List<@Valid @NotNull TemplateField> fields,
		@NotNull @Size(min = 1, max = 30, message = "{validation.template.rules}") List<@Valid @NotNull TemplateRule> rules) {

	public TemplateDefinition {
		name = name == null ? null : name.trim();
		description = description == null ? "" : description.trim();
		fields = fields == null ? List.of() : List.copyOf(fields);
		rules = rules == null ? List.of() : List.copyOf(rules);
	}

}
