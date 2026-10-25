package io.github.son30kins.workbench.infrastructure.persistence;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import io.github.son30kins.workbench.domain.task.Task;
import io.github.son30kins.workbench.domain.task.TaskCounts;
import io.github.son30kins.workbench.domain.task.TaskStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

interface TaskSpringDataRepository extends JpaRepository<Task, UUID>, JpaSpecificationExecutor<Task> {

	Optional<Task> findByIdAndUserId(UUID id, UUID userId);

	long deleteByIdAndUserId(UUID id, UUID userId);

	List<Task> findByUserIdAndStatusInAndDueAtBeforeOrderByDueAtAscPriorityRankAsc(UUID userId,
			Collection<TaskStatus> statuses, Instant before);

	List<Task> findByUserIdAndStatusInAndDueAtIsNotNull(UUID userId, Collection<TaskStatus> statuses);

	/** Một truy vấn, 4 con số — dùng constructor expression của JPQL để trả thẳng record. */
	@Query("""
			select new io.github.son30kins.workbench.domain.task.TaskCounts(
			  coalesce(sum(case when t.status in :active then 1 else 0 end), 0),
			  coalesce(sum(case when t.status in :active and t.dueAt >= :today and t.dueAt < :tomorrow then 1 else 0 end), 0),
			  coalesce(sum(case when t.status in :active and t.dueAt < :now then 1 else 0 end), 0),
			  coalesce(sum(case when t.status in :active and t.dueAt >= :today and t.dueAt < :weekEnd then 1 else 0 end), 0))
			from Task t where t.userId = :userId
			""")
	TaskCounts countForPanel(UUID userId, Collection<TaskStatus> active, Instant now, Instant today, Instant tomorrow,
			Instant weekEnd);

	@Query("select t.userId as userId, count(t) as total from Task t group by t.userId")
	List<UserTaskCount> countGroupedByUser();

	/** Interface projection: Spring Data tự map cột alias vào getter. */
	interface UserTaskCount {

		UUID getUserId();

		long getTotal();

	}

}
