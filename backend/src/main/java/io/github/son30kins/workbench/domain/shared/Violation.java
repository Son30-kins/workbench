package io.github.son30kins.workbench.domain.shared;

/**
 * Một vi phạm quy tắc dữ liệu. {@code path} dạng "rules.0.title" để giao diện tô đúng ô bị lỗi.
 */
public record Violation(String path, Translatable message) {

	public static Violation of(String path, String code, Object... args) {
		return new Violation(path, Translatable.of(code, args));
	}

}
