package io.github.son30kins.workbench.application;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import io.github.son30kins.workbench.IntegrationTest;
import io.github.son30kins.workbench.TestFixtures;
import io.github.son30kins.workbench.domain.task.Priority;
import io.github.son30kins.workbench.domain.task.TaskData;
import io.github.son30kins.workbench.application.task.TaskService;
import io.github.son30kins.workbench.domain.task.TaskStatus;
import io.github.son30kins.workbench.domain.task.TaskView;
import io.github.son30kins.workbench.application.template.TemplateService;
import io.github.son30kins.workbench.domain.user.Role;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

/** Người dùng B không đọc / sửa / xoá / chạy được dữ liệu của người dùng A. */
@IntegrationTest
class DataIsolationTests {

	@Autowired
	TestFixtures fixtures;

	@Autowired
	TaskService tasks;

	@Autowired
	TemplateService templates;

	@Test
	void bKhongDongDuocTaskCuaA() {
		var a = fixtures.context(Role.USER);
		var b = fixtures.context(Role.USER);
		var task = tasks.create(a, new TaskData("Việc của A", "", Instant.now().plus(Duration.ofDays(3)), Priority.HIGH,
				TaskStatus.TODO, List.of(), List.of(new TaskData.SubtaskData("con", false))));

		assertThat(tasks.get(b, task.getId())).isEmpty();
		assertThat(tasks.update(b, task.getId(), TaskData.of("B sửa", null, Priority.LOW))).isEmpty();
		assertThat(tasks.changeStatus(b, task.getId(), TaskStatus.DONE)).isEmpty();
		assertThat(tasks.snooze(b, task.getId(), Instant.now().plusSeconds(60))).isFalse();
		assertThat(tasks.delete(b, task.getId())).isFalse();

		var subtaskId = tasks.get(a, task.getId()).orElseThrow().getSubtasks().getFirst().getId();
		assertThat(tasks.toggleSubtask(b, subtaskId, true)).isFalse();
		assertThat(tasks.toggleSubtask(a, subtaskId, true)).isTrue();

		assertThat(tasks.list(b, TaskView.ALL, null)).extracting("id").doesNotContain(task.getId());
		assertThat(tasks.list(a, TaskView.ALL, null)).extracting("id").contains(task.getId());
		assertThat(tasks.get(a, task.getId()).orElseThrow().getTitle()).isEqualTo("Việc của A");
	}

	@Test
	void bKhongThayKhongSuaKhongChayDuocTemplateCuaA() {
		var a = fixtures.context(Role.USER);
		var b = fixtures.context(Role.USER);
		templates.seedDefaults(a.id(), a.language());
		var quick = templates.list(a.id()).stream().filter(t -> t.getName().equals("Việc nhanh")).findFirst().orElseThrow();

		assertThat(templates.get(b.id(), quick.getId())).isEmpty();
		assertThat(templates.list(b.id())).extracting("id").doesNotContain(quick.getId());
		assertThat(templates.update(b.id(), quick.getId(), quick.toDefinition())).isEmpty();
		assertThat(templates.run(b, quick.getId(), Map.of("viec", "x"))).isEmpty();
		assertThat(templates.preview(b, quick.getId(), Map.of("viec", "x"))).isEmpty();
		assertThat(templates.duplicate(b, quick.getId())).isEmpty();
		assertThat(templates.delete(b.id(), quick.getId())).isFalse();
		assertThat(templates.get(a.id(), quick.getId()).orElseThrow().getName()).isEqualTo("Việc nhanh");
	}

	@Test
	void chayFormMauTaoTaskVaLuuJsonbDung() {
		var a = fixtures.context(Role.USER);
		templates.seedDefaults(a.id(), a.language());
		var report = templates.list(a.id()).stream().filter(t -> t.getName().equals("Báo cáo tuần")).findFirst().orElseThrow();
		// Đọc lại từ DB: fields/rules (jsonb) giữ nguyên kiểu record
		assertThat(templates.get(a.id(), report.getId()).orElseThrow().getRules().getFirst().due().time()).isEqualTo("17:00");

		var count = templates.run(a, report.getId(),
				Map.of("tuan", "43", "ngay_nop", "2030-10-31", "du_an", "Alpha", "gui_sep", true));
		assertThat(count).hasValue(3);
		// "Alpha" khớp tiêu đề task 1 và mô tả task 2 ("Dự án: Alpha"); sắp theo hạn
		assertThat(tasks.list(a, TaskView.ALL, "Alpha")).extracting("title")
			.containsExactly("Thu thập số liệu Alpha — tuần 43", "Viết báo cáo tuần 43");
		assertThat(tasks.list(a, TaskView.ALL, null)).extracting("templateName").containsOnly("Báo cáo tuần");
		assertThat(templates.recentRuns(a.id(), 10)).singleElement().satisfies(run -> assertThat(run.getTaskCount()).isEqualTo(3));
	}

}
