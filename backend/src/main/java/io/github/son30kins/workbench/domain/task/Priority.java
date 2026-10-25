package io.github.son30kins.workbench.domain.task;

/** Mức ưu tiên. Thứ tự khai báo = thứ tự sắp xếp (khẩn cấp trước). */
public enum Priority {

	URGENT("Khẩn cấp", "🔴"), HIGH("Cao", "🟠"), MEDIUM("Trung bình", "🔵"), LOW("Thấp", "⚪");

	private final String label;

	private final String icon;

	Priority(String label, String icon) {
		this.label = label;
		this.icon = icon;
	}

	public String label() {
		return label;
	}

	public String icon() {
		return icon;
	}

}
