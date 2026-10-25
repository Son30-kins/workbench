package io.github.son30kins.workbench.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.domain.task.Subtask;
import io.github.son30kins.workbench.domain.task.SubtaskRepository;

import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
class SubtaskRepositoryAdapter implements SubtaskRepository {

	private final SubtaskSpringDataRepository jpa;

	@Override
	public Optional<Subtask> findOwned(UUID subtaskId, UUID userId) {
		return jpa.findByIdAndTaskUserId(subtaskId, userId);
	}

}
