package io.github.son30kins.workbench.domain.task;

/**
 * Mức ưu tiên. Thứ tự khai báo = thứ tự sắp xếp (khẩn cấp trước). Tên hiển thị theo ngôn ngữ nằm ở
 * {@code messages_*.properties} (khoá {@code priority.URGENT}…).
 */
public enum Priority {

	URGENT("🔴"), HIGH("🟠"), MEDIUM("🔵"), LOW("⚪");

	private final String icon;

	Priority(String icon) {
		this.icon = icon;
	}

	public String icon() {
		return icon;
	}

}
