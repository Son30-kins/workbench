package io.github.son30kins.workbench.infrastructure.persistence;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import io.github.son30kins.workbench.domain.reminder.Reminder;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface ReminderSpringDataRepository extends JpaRepository<Reminder, UUID> {

	List<Reminder> findByTaskIdAndStatus(UUID taskId, Reminder.Status status);

	@Modifying
	@Query("delete from Reminder r where r.taskId = :taskId and r.status = :status")
	void deleteByTaskIdAndStatus(UUID taskId, Reminder.Status status);

	/**
	 * {@code FOR UPDATE SKIP LOCKED}: dòng nào instance khác đang khoá thì bỏ qua → mỗi lần nhắc chỉ được
	 * một instance lấy ra, không cần khoá toàn bảng.
	 */
	@Query(value = """
			select * from reminders
			where status = 'PENDING' and fire_at <= :now
			order by fire_at
			limit :batch
			for update skip locked
			""", nativeQuery = true)
	List<Reminder> lockDue(Instant now, int batch);

	@Modifying
	@Query("update Reminder r set r.status = :status, r.sentAt = :now where r.id in :ids")
	void markStatus(Collection<UUID> ids, Reminder.Status status, Instant now);

	@Modifying
	@Query("update Reminder r set r.lastError = :error where r.id = :id")
	void updateError(UUID id, String error);

	@Modifying
	@Query("update Reminder r set r.status = :status, r.lastError = :error where r.id = :id")
	void updateStatusAndError(UUID id, Reminder.Status status, String error);

}
