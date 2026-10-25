package io.github.son30kins.workbench.domain.shared;

import java.util.Arrays;
import java.util.List;

/**
 * Thông điệp cho người dùng dạng mã + tham số (ví dụ {@code error.template.duplicateKey} + "tuan"). Domain không
 * biết người đọc dùng ngôn ngữ nào — tầng ngoài dịch mã sang câu chữ bằng {@code messages_*.properties}.
 */
public record Translatable(String code, List<Object> args) {

	public Translatable {
		args = List.copyOf(args);
	}

	public static Translatable of(String code, Object... args) {
		return new Translatable(code, Arrays.asList(args));
	}

	public Object[] argsArray() {
		return args.toArray();
	}

}
