package io.github.son30kins.workbench.domain.template;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Stream;

import io.github.son30kins.workbench.domain.shared.Violation;

/**
 * Kiểm tra liên trường mà Bean Validation không diễn đạt được: mã trùng, mốc hạn phải là trường ngày,
 * điều kiện / biến phải trỏ tới trường có thật. Path lỗi dạng "rules.0.due.anchor".
 */
public final class TemplateValidator {

	private TemplateValidator() {
	}

	public static List<Violation> validate(List<TemplateField> fields, List<TemplateRule> rules) {
		var violations = new ArrayList<Violation>();
		var byKey = new HashMap<String, TemplateField>();

		for (int i = 0; i < fields.size(); i++) {
			var f = fields.get(i);
			if (byKey.containsKey(f.key())) {
				violations.add(Violation.of("fields.%d.key".formatted(i), "error.template.duplicateKey", f.key()));
			}
			if (TemplateEngine.BUILTIN_VARIABLES.contains(f.key())) {
				violations.add(Violation.of("fields.%d.key".formatted(i), "error.template.builtinKey", f.key()));
			}
			if (f.type() == FieldType.SELECT && f.options().isEmpty()) {
				violations.add(Violation.of("fields.%d.options".formatted(i), "error.template.noOptions"));
			}
			byKey.put(f.key(), f);
		}

		for (int i = 0; i < rules.size(); i++) {
			var r = rules.get(i);
			var anchor = r.due().anchor();
			if (anchor != null && !TemplateRule.ANCHOR_SUBMITTED.equals(anchor)) {
				var f = byKey.get(anchor);
				if (f == null || !f.type().isDateLike()) {
					violations.add(Violation.of("rules.%d.due.anchor".formatted(i), "error.template.anchorNotDate"));
				}
			}
			if (r.condition() != null && !byKey.containsKey(r.condition().field())) {
				violations.add(Violation.of("rules.%d.condition".formatted(i), "error.template.unknownConditionField"));
			}
			var texts = Stream.of(Stream.of(r.title(), r.description()), r.subtasks().stream(), r.tags().stream())
				.flatMap(s -> s);
			for (var v : texts.flatMap(t -> TemplateEngine.variables(t).stream()).distinct().toList()) {
				if (!byKey.containsKey(v) && !TemplateEngine.BUILTIN_VARIABLES.contains(v)) {
					violations.add(Violation.of("rules.%d.title".formatted(i), "error.template.unknownVariable", v));
				}
			}
		}
		return violations;
	}

}
