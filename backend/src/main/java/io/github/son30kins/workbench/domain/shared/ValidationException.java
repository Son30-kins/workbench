package io.github.son30kins.workbench.domain.shared;

import java.util.List;

/** Dữ liệu không hợp lệ — kèm danh sách lỗi theo từng trường. */
public class ValidationException extends DomainException {

	private final List<Violation> violations;

	public ValidationException(List<Violation> violations) {
		super(violations.isEmpty() ? "Dữ liệu không hợp lệ" : violations.getFirst().message());
		this.violations = List.copyOf(violations);
	}

	public List<Violation> violations() {
		return violations;
	}

}
