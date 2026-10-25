package io.github.son30kins.workbench.domain.shared;

/**
 * Vi phạm quy tắc nghiệp vụ (ví dụ "cần ít nhất 1 admin"). Tầng interfaces chuyển thành HTTP 400 và dịch mã
 * thông điệp sang ngôn ngữ của người dùng; domain và application không biết gì về HTTP hay ngôn ngữ.
 */
public class DomainException extends RuntimeException {

	private final Translatable translatable;

	public DomainException(String code, Object... args) {
		this(Translatable.of(code, args));
	}

	public DomainException(Translatable translatable) {
		super(translatable.code());
		this.translatable = translatable;
	}

	public Translatable translatable() {
		return translatable;
	}

}
