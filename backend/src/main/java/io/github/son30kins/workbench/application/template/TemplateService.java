package io.github.son30kins.workbench.application.template;

import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.application.i18n.Translator;
import io.github.son30kins.workbench.application.task.TaskService;
import io.github.son30kins.workbench.domain.shared.Language;
import io.github.son30kins.workbench.domain.shared.ValidationException;
import io.github.son30kins.workbench.domain.task.TaskData;
import io.github.son30kins.workbench.domain.task.TaskStatus;
import io.github.son30kins.workbench.domain.template.DefaultTemplates;
import io.github.son30kins.workbench.domain.template.InvalidFormValuesException;
import io.github.son30kins.workbench.domain.template.Template;
import io.github.son30kins.workbench.domain.template.TemplateDefinition;
import io.github.son30kins.workbench.domain.template.TemplateEngine;
import io.github.son30kins.workbench.domain.template.TemplateRepository;
import io.github.son30kins.workbench.domain.template.TemplateRun;
import io.github.son30kins.workbench.domain.template.TemplateValidator;
import io.github.son30kins.workbench.domain.user.UserContext;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Use case về form mẫu. Mọi phương thức lọc theo chủ sở hữu. */
@Service
@Transactional
@RequiredArgsConstructor
public class TemplateService {

	private final TemplateRepository templates;

	private final TaskService taskService;

	private final Translator translator;

	private final Clock clock;

	@Transactional(readOnly = true)
	public List<Template> list(UUID userId) {
		return templates.findByUser(userId);
	}

	@Transactional(readOnly = true)
	public Optional<Template> get(UUID userId, UUID templateId) {
		return templates.findOwned(templateId, userId);
	}

	public Template create(UUID userId, TemplateDefinition definition) {
		check(definition);
		return templates.save(new Template(userId, definition));
	}

	public Optional<Template> update(UUID userId, UUID templateId, TemplateDefinition definition) {
		check(definition);
		return templates.findOwned(templateId, userId).map(template -> {
			template.update(definition);
			return template;
		});
	}

	public Optional<Template> duplicate(UserContext owner, UUID templateId) {
		var suffix = translator.get(owner.locale(), "template.copySuffix");
		return templates.findOwned(templateId, owner.id())
			.map(original -> templates.save(new Template(owner.id(), original.copyDefinition(suffix))));
	}

	public boolean delete(UUID userId, UUID templateId) {
		return templates.deleteOwned(templateId, userId);
	}

	/** Tính trước danh sách task từ dữ liệu form (chưa lưu). */
	@Transactional(readOnly = true)
	public Optional<TemplateEngine.Plan> preview(UserContext owner, UUID templateId, Map<String, ?> rawValues) {
		return templates.findOwned(templateId, owner.id()).map(template -> plan(template, owner, rawValues).plan());
	}

	/** Điền form → lưu lịch sử + tạo toàn bộ task trong cùng 1 transaction. Trả về số task đã tạo. */
	public Optional<Integer> run(UserContext owner, UUID templateId, Map<String, ?> rawValues) {
		return templates.findOwned(templateId, owner.id()).map(template -> {
			var planned = plan(template, owner, rawValues);
			var run = templates.saveRun(new TemplateRun(template, planned.values(), planned.plan().tasks().size()));
			for (var t : planned.plan().tasks()) {
				var data = new TaskData(t.title(), t.description(), t.dueAt(), t.priority(), TaskStatus.TODO, t.tags(),
						t.subtasks().stream().map(s -> new TaskData.SubtaskData(s, false)).toList());
				taskService.create(owner, data, run.getId(), template.getName());
			}
			return planned.plan().tasks().size();
		});
	}

	@Transactional(readOnly = true)
	public List<TemplateRun> recentRuns(UUID userId, int limit) {
		return templates.findRecentRuns(userId, limit);
	}

	/** Bộ form mặc định cho tài khoản mới, theo ngôn ngữ của người dùng. */
	public void seedDefaults(UUID userId, Language language) {
		DefaultTemplates.forLanguage(language).forEach(definition -> templates.save(new Template(userId, definition)));
	}

	private record Planned(Map<String, Object> values, TemplateEngine.Plan plan) {
	}

	private Planned plan(Template template, UserContext owner, Map<String, ?> rawValues) {
		var validated = TemplateEngine.validateValues(template.getFields(), rawValues);
		if (validated.hasErrors()) {
			throw new InvalidFormValuesException(validated.errors());
		}
		return new Planned(validated.values(), TemplateEngine.plan(template.getFields(), template.getRules(),
				validated.values(), owner.zone(), clock.instant(), owner.language()));
	}

	private static void check(TemplateDefinition definition) {
		var violations = TemplateValidator.validate(definition.fields(), definition.rules());
		if (!violations.isEmpty()) {
			throw new ValidationException(violations);
		}
	}

}
