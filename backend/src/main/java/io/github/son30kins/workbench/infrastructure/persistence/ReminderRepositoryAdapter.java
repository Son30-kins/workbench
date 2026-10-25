package io.github.son30kins.workbench.infrastructure.persistence;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.domain.reminder.Reminder;
import io.github.son30kins.workbench.domain.reminder.ReminderRepository;

import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Repository
@RequiredArgsConstructor
class ReminderRepositoryAdapter implements ReminderRepository {

	private final ReminderSpringDataRepository jpa;

	@Override
	public Reminder save(Reminder reminder) {
		return jpa.save(reminder);
	}

	@Override
	public List<Reminder> findByTask(UUID taskId, Reminder.Status status) {
		return jpa.findByTaskIdAndStatus(taskId, status);
	}

	@Override
	public void deletePending(UUID taskId) {
		jpa.deleteByTaskIdAndStatus(taskId, Reminder.Status.PENDING);
	}

	/** Khoá (SKIP LOCKED) rồi đánh dấu SENT — bắt buộc chạy trong transaction của nơi gọi. */
	@Override
	@Transactional(propagation = Propagation.MANDATORY)
	public List<Reminder> claimDue(Instant now, int batch) {
		var due = jpa.lockDue(now, batch);
		if (!due.isEmpty()) {
			jpa.markStatus(due.stream().map(Reminder::getId).toList(), Reminder.Status.SENT, now);
		}
		return due;
	}

	@Override
	public void recordError(UUID reminderId, String error) {
		jpa.updateError(reminderId, error);
	}

	@Override
	public void markFailed(UUID reminderId, String error) {
		jpa.updateStatusAndError(reminderId, Reminder.Status.FAILED, error);
	}

}
