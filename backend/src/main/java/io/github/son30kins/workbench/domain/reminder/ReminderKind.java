package io.github.son30kins.workbench.domain.reminder;

public enum ReminderKind {

	/** Nhắc trước hạn theo lịch của mức ưu tiên. */
	BEFORE_DUE,
	/** Đúng lúc hết hạn, sau đó lặp lại mỗi {@code overdueRepeatHours}. */
	OVERDUE,
	/** Người dùng bấm "Hoãn" trong Telegram. */
	SNOOZE

}
