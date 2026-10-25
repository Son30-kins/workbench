package io.github.son30kins.workbench.domain.template;

import java.util.Map;

import io.github.son30kins.workbench.domain.shared.DomainException;

/** Giá trị điền vào form mẫu không hợp lệ — key là mã trường của form. */
public class InvalidFormValuesException extends DomainException {

	private final Map<String, String> fieldErrors;

	public InvalidFormValuesException(Map<String, String> fieldErrors) {
		super("Kiểm tra lại các ô được đánh dấu");
		this.fieldErrors = Map.copyOf(fieldErrors);
	}

	public Map<String, String> fieldErrors() {
		return fieldErrors;
	}

}
