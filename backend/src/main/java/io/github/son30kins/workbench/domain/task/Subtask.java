package io.github.son30kins.workbench.domain.task;

import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Task con — thuộc aggregate {@link Task}, chỉ tạo qua {@link Task#apply}. */
@Entity
@Table(name = "subtasks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Subtask {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Getter(AccessLevel.NONE)
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "task_id")
	private Task task;

	private String title;

	private boolean done;

	private int position;

	Subtask(Task task, String title, boolean done, int position) {
		this.task = task;
		this.title = title;
		this.done = done;
		this.position = position;
	}

	public void markDone(boolean done) {
		this.done = done;
	}

}
