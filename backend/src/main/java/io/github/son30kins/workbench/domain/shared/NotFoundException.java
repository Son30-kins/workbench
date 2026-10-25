package io.github.son30kins.workbench.domain.shared;

/** Không tìm thấy (hoặc không thuộc về người dùng — hai trường hợp được coi như nhau). */
public class NotFoundException extends DomainException {

	public NotFoundException(String message) {
		super(message);
	}

}
