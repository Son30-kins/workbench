package io.github.son30kins.workbench.domain.reminder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Port lưu trữ lịch nhắc. */
public interface ReminderRepository {

	Reminder save(Reminder reminder);

	List<Reminder> findByTask(UUID taskId, Reminder.Status status);

	/** Xoá các lần nhắc chưa gửi của một task (trước khi tính lại lịch). */
	void deletePending(UUID taskId);

	/**
	 * Lấy tối đa {@code batch} lần nhắc đã đến giờ và đánh dấu SENT trong cùng transaction.
	 * Hiện thực phải đảm bảo mỗi lần nhắc chỉ được lấy đúng 1 lần kể cả khi chạy nhiều instance.
	 */
	List<Reminder> claimDue(Instant now, int batch);

	void recordError(UUID reminderId, String error);

	void markFailed(UUID reminderId, String error);

}
