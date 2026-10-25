package io.github.son30kins.workbench.domain.template;

import java.util.Map;

import io.github.son30kins.workbench.domain.shared.DomainException;
import io.github.son30kins.workbench.domain.shared.Translatable;

/** Giá trị điền vào form mẫu không hợp lệ — key là mã trường của form. */
public class InvalidFormValuesException extends DomainException {

	private final Map<String, Translatable> fieldErrors;

	public InvalidFormValuesException(Map<String, Translatable> fieldErrors) {
		super("error.form.invalid");
		this.fieldErrors = Map.copyOf(fieldErrors);
	}

	public Map<String, Translatable> fieldErrors() {
		return fieldErrors;
	}

}
