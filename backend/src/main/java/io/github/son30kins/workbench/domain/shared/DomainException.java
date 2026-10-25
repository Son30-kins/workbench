package io.github.son30kins.workbench.domain.shared;

/**
 * Vi phạm quy tắc nghiệp vụ (ví dụ "cần ít nhất 1 admin"). Tầng interfaces chuyển thành HTTP 400;
 * domain và application không biết gì về HTTP.
 */
public class DomainException extends RuntimeException {

	public DomainException(String message) {
		super(message);
	}

}
