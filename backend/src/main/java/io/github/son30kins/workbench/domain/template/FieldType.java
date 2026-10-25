package io.github.son30kins.workbench.domain.template;

/** Kiểu của một ô trong form mẫu. */
public enum FieldType {

	TEXT, TEXTAREA, NUMBER, DATE, DATETIME, SELECT, CHECKBOX;

	public boolean isDateLike() {
		return this == DATE || this == DATETIME;
	}

}
