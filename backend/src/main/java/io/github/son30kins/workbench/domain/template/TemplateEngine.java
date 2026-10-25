package io.github.son30kins.workbench.domain.template;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.time.temporal.IsoFields;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import io.github.son30kins.workbench.domain.shared.TimeZones;
import io.github.son30kins.workbench.domain.task.Priority;

/**
 * Bộ máy form mẫu: kiểm tra dữ liệu điền vào, thay {@code {{biến}}}, tính hạn chót và sinh danh sách task.
 * Hàm thuần — không đọc DB, "bây giờ" và múi giờ được truyền vào.
 */
public final class TemplateEngine {

	static final Pattern VARIABLE = Pattern.compile("\\{\\{\\s*([a-zA-Z0-9_]+)\\s*}}");

	private static final Pattern DATE = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");

	private static final Pattern DATETIME = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}");

	/** Mốc hạn là một ngày (không có giờ) và quy tắc không đặt giờ → hạn cuối ngày. */
	private static final LocalTime DEFAULT_DATE_TIME = LocalTime.of(23, 59);

	/** Biến có sẵn, dùng được trong mọi template. */
	public static final Map<String, String> BUILTIN_VARIABLES = Map.of("today", "Ngày điền form (dd/MM/yyyy)", "week",
			"Số tuần trong năm", "month", "Tháng", "year", "Năm");

	private TemplateEngine() {
	}

	/** Một task sẽ được tạo (chưa lưu). */
	public record PlannedTask(String ruleId, String title, String description, Priority priority, Instant dueAt,
			List<String> subtasks, List<String> tags) {
	}

	public record Plan(List<PlannedTask> tasks, List<String> warnings) {
	}

	/** Giá trị đã chuẩn hoá (String hoặc Boolean) + lỗi theo mã trường. */
	public record ValidatedValues(Map<String, Object> values, Map<String, String> errors) {

		public boolean hasErrors() {
			return !errors.isEmpty();
		}
	}

	private record Context(List<TemplateField> fields, Map<String, Object> values, ZoneId zone, Instant now) {

		TemplateField field(String key) {
			return fields.stream().filter(f -> f.key().equals(key)).findFirst().orElse(null);
		}
	}

	/** Kiểm tra và chuẩn hoá dữ liệu người dùng điền vào form. */
	public static ValidatedValues validateValues(List<TemplateField> fields, Map<String, ?> raw) {
		var values = new LinkedHashMap<String, Object>();
		var errors = new LinkedHashMap<String, String>();

		for (var field : fields) {
			Object input = raw.get(field.key());
			if (field.type() == FieldType.CHECKBOX) {
				values.put(field.key(),
						Boolean.TRUE.equals(input) || "on".equals(input) || "true".equals(input));
				continue;
			}
			String v = input instanceof String s ? s.trim() : "";
			if (v.isEmpty()) {
				if (field.required()) {
					errors.put(field.key(), "Bắt buộc");
				}
				values.put(field.key(), "");
				continue;
			}
			String error = switch (field.type()) {
				case NUMBER -> isFiniteNumber(v) ? null : "Phải là số";
				case DATE -> parseDate(v) != null ? null : "Ngày không hợp lệ";
				case DATETIME -> parseDateTime(v) != null ? null : "Ngày giờ không hợp lệ";
				case SELECT -> field.options().contains(v) ? null : "Lựa chọn không hợp lệ";
				default -> null;
			};
			if (error != null) {
				errors.put(field.key(), error);
			}
			values.put(field.key(), v.length() > 2000 ? v.substring(0, 2000) : v);
		}
		return new ValidatedValues(values, errors);
	}

	/** Từ template + dữ liệu form đã kiểm tra → danh sách task sẽ tạo. */
	public static Plan plan(List<TemplateField> fields, List<TemplateRule> rules, Map<String, Object> values,
			ZoneId zone, Instant now) {
		var ctx = new Context(fields, values, zone, now);
		var tasks = new ArrayList<PlannedTask>();
		var warnings = new ArrayList<String>();

		for (var rule : rules) {
			if (!conditionMet(rule, values)) {
				continue;
			}
			var rendered = render(rule.title(), ctx).trim();
			var title = rendered.isEmpty() ? "(không có tiêu đề)" : rendered;
			var due = computeDue(rule, ctx);
			if (due.missingAnchor()) {
				warnings.add("\"%s\": chưa điền ngày làm mốc nên task không có hạn".formatted(title));
			}
			if (due.dueAt() != null && due.dueAt().isBefore(now)) {
				warnings.add("\"%s\": hạn chót đã ở trong quá khứ".formatted(title));
			}
			var tags = new LinkedHashSet<String>();
			rule.tags().stream().map(t -> render(t, ctx).trim()).filter(t -> !t.isEmpty()).forEach(tags::add);

			tasks.add(new PlannedTask(rule.id(), truncate(title, 200), truncate(render(rule.description(), ctx), 5000),
					rule.priority(), due.dueAt(),
					rule.subtasks().stream().map(s -> render(s, ctx).trim()).filter(s -> !s.isEmpty()).toList(),
					List.copyOf(tags)));
		}
		return new Plan(List.copyOf(tasks), List.copyOf(warnings));
	}

	/** Thay {@code {{biến}}} bằng giá trị đã điền; biến không có giá trị → chuỗi rỗng. */
	public static String renderText(String template, List<TemplateField> fields, Map<String, Object> values,
			ZoneId zone, Instant now) {
		return render(template, new Context(fields, values, zone, now));
	}

	/** Các biến đang dùng trong một chuỗi. */
	public static List<String> variables(String text) {
		var result = new ArrayList<String>();
		Matcher m = VARIABLE.matcher(text == null ? "" : text);
		while (m.find()) {
			result.add(m.group(1));
		}
		return result;
	}

	private static String render(String template, Context ctx) {
		var today = TimeZones.localDate(ctx.now(), ctx.zone());
		Map<String, String> builtins = Map.of("today", TimeZones.format(ctx.now(), ctx.zone(), "dd/MM/yyyy"), "week",
				String.valueOf(today.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR)), "month",
				String.valueOf(today.getMonthValue()), "year", String.valueOf(today.getYear()));

		return VARIABLE.matcher(template).replaceAll(match -> {
			var key = match.group(1);
			var field = ctx.field(key);
			var value = field != null ? display(field, ctx.values().get(key), ctx.zone())
					: builtins.getOrDefault(key, "");
			return Matcher.quoteReplacement(value);
		});
	}

	private static String display(TemplateField field, Object value, ZoneId zone) {
		if (value == null || "".equals(value)) {
			return "";
		}
		if (value instanceof Boolean b) {
			return b ? "Có" : "Không";
		}
		var text = value.toString();
		if (field.type() == FieldType.DATE) {
			var date = parseDate(text);
			return date == null ? text : TimeZones.format(TimeZones.fromLocal(date, LocalTime.NOON, zone), zone,
					"dd/MM/yyyy");
		}
		if (field.type() == FieldType.DATETIME) {
			var dateTime = parseDateTime(text);
			return dateTime == null ? text
					: TimeZones.format(TimeZones.fromLocal(dateTime, zone), zone, "dd/MM/yyyy HH:mm");
		}
		return text;
	}

	private static boolean conditionMet(TemplateRule rule, Map<String, Object> values) {
		var condition = rule.condition();
		if (condition == null) {
			return true;
		}
		Object v = values.get(condition.field());
		if (condition.equals().isEmpty()) {
			return Boolean.TRUE.equals(v) || (v instanceof String s && !s.isEmpty());
		}
		return Objects.equals(String.valueOf(v), condition.equals());
	}

	private record Due(Instant dueAt, boolean missingAnchor) {
	}

	private static Due computeDue(TemplateRule rule, Context ctx) {
		var due = rule.due();
		if (due.anchor() == null) {
			return new Due(null, false);
		}
		Instant base;
		boolean anchorIsDate = false;
		if (TemplateRule.ANCHOR_SUBMITTED.equals(due.anchor())) {
			base = ctx.now();
		}
		else {
			var field = ctx.field(due.anchor());
			Object v = ctx.values().get(due.anchor());
			if (field == null || !(v instanceof String s) || s.isEmpty()) {
				return new Due(null, true);
			}
			if (field.type() == FieldType.DATE) {
				var date = parseDate(s);
				base = date == null ? null : TimeZones.fromLocal(date, LocalTime.MIDNIGHT, ctx.zone());
				anchorIsDate = true;
			}
			else {
				var dateTime = parseDateTime(s);
				base = dateTime == null ? null : TimeZones.fromLocal(dateTime, ctx.zone());
			}
			if (base == null) {
				return new Due(null, true);
			}
		}

		var result = TimeZones.addLocalDays(base, due.offsetDays(), ctx.zone()).plus(Duration.ofHours(due.offsetHours()));
		if (due.localTime() != null) {
			result = TimeZones.setLocalTime(result, due.localTime(), ctx.zone());
		}
		else if (anchorIsDate && due.offsetHours() == 0) {
			result = TimeZones.setLocalTime(result, DEFAULT_DATE_TIME, ctx.zone());
		}
		return new Due(result, false);
	}

	static LocalDate parseDate(String value) {
		if (!DATE.matcher(value).matches()) {
			return null;
		}
		try {
			return LocalDate.parse(value);
		}
		catch (DateTimeParseException ex) {
			return null;
		}
	}

	/** Giá trị của {@code <input type="datetime-local">}: "2026-10-31T17:00" (có thể kèm giây). */
	static LocalDateTime parseDateTime(String value) {
		if (!DATETIME.matcher(value).find()) {
			return null;
		}
		try {
			return LocalDateTime.parse(value.substring(0, 16));
		}
		catch (DateTimeParseException ex) {
			return null;
		}
	}

	private static boolean isFiniteNumber(String value) {
		try {
			return Double.isFinite(Double.parseDouble(value));
		}
		catch (NumberFormatException ex) {
			return false;
		}
	}

	private static String truncate(String value, int max) {
		return value.length() > max ? value.substring(0, max) : value;
	}

}
