package io.github.son30kins.workbench.domain.template;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Một ô trong form mẫu. {@code key} là tên biến dùng trong quy tắc, ví dụ {@code {{ngay_nop}}}.
 * Compact constructor chuẩn hoá giá trị thiếu (JSON không có trường → mặc định).
 */
public record TemplateField(
		@NotNull(message = "Nhập mã trường") @Pattern(regexp = "^[a-z][a-z0-9_]{0,39}$",
				message = "Mã trường: chữ thường không dấu, số, gạch dưới; bắt đầu bằng chữ") String key,
		@NotBlank(message = "Nhập tên trường") @Size(max = 80) String label,
		@NotNull(message = "Chọn kiểu trường") FieldType type,
		boolean required,
		@Size(max = 30) List<@NotBlank @Size(max = 80) String> options,
		@Size(max = 500) String defaultValue) {

	public TemplateField {
		label = label == null ? null : label.trim();
		options = options == null ? List.of() : options.stream().map(String::trim).toList();
		defaultValue = defaultValue == null ? "" : defaultValue;
	}

}
