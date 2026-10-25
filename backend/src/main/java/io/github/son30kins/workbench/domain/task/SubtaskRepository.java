package io.github.son30kins.workbench.domain.task;

import java.util.Optional;
import java.util.UUID;

/** Port tìm task con — luôn kèm chủ sở hữu của task cha. */
public interface SubtaskRepository {

	Optional<Subtask> findOwned(UUID subtaskId, UUID userId);

}
