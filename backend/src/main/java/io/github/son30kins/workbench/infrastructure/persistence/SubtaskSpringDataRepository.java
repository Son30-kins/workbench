package io.github.son30kins.workbench.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;

import io.github.son30kins.workbench.domain.task.Subtask;

import org.springframework.data.jpa.repository.JpaRepository;

interface SubtaskSpringDataRepository extends JpaRepository<Subtask, UUID> {

	/** Derived query đi qua quan hệ: subtask.task.userId = :userId. */
	Optional<Subtask> findByIdAndTaskUserId(UUID id, UUID userId);

}
