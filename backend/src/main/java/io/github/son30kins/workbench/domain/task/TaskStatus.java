package io.github.son30kins.workbench.domain.task;

import java.util.Set;

public enum TaskStatus {

	TODO, IN_PROGRESS, DONE, CANCELLED;

	/** Task còn đang mở — còn nhắc việc, còn tính vào bộ đếm. */
	public static final Set<TaskStatus> ACTIVE = Set.of(TODO, IN_PROGRESS);

	public boolean isClosed() {
		return this == DONE || this == CANCELLED;
	}

}
