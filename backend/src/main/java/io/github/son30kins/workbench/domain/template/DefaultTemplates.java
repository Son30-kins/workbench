package io.github.son30kins.workbench.domain.template;

import java.util.List;

import io.github.son30kins.workbench.domain.shared.Language;
import io.github.son30kins.workbench.domain.task.Priority;
import io.github.son30kins.workbench.domain.template.TemplateRule.Condition;
import io.github.son30kins.workbench.domain.template.TemplateRule.Due;

/**
 * Ba form mẫu tự thêm cho mỗi tài khoản mới, theo ngôn ngữ người dùng chọn lúc đăng nhập lần đầu. Sau đó form là
 * dữ liệu của người dùng (sửa thoải mái) — đổi ngôn ngữ không dịch lại form đã có.
 */
public final class DefaultTemplates {

	private DefaultTemplates() {
	}

	public static List<TemplateDefinition> forLanguage(Language language) {
		return switch (language) {
			case VI -> VI;
			case EN -> EN;
			case DE -> DE;
		};
	}

	// ===== Tiếng Việt =====

	private static final List<TemplateDefinition> VI = List.of(
			new TemplateDefinition("Báo cáo tuần", "Thu thập số liệu, viết và gửi báo cáo trước hạn nộp.",
					List.of(field("tuan", "Tuần số", FieldType.NUMBER, true),
							field("ngay_nop", "Hạn nộp", FieldType.DATE, true),
							field("du_an", "Dự án", FieldType.TEXT, true),
							field("gui_sep", "Gửi báo cáo cho quản lý", FieldType.CHECKBOX, false)),
					List.of(new TemplateRule("thu-thap", "Thu thập số liệu {{du_an}} — tuần {{tuan}}", "",
							Priority.HIGH, new Due("ngay_nop", -2, 0, "17:00"), null,
							List.of("Số liệu tiến độ", "Vấn đề tồn đọng", "Kế hoạch tuần sau"), List.of("báo cáo")),
							new TemplateRule("viet", "Viết báo cáo tuần {{tuan}}", "Dự án: {{du_an}}", Priority.HIGH,
									new Due("ngay_nop", -1, 0, "17:00"), null, List.of(), List.of("báo cáo")),
							new TemplateRule("gui", "Gửi báo cáo tuần {{tuan}} cho quản lý", "", Priority.URGENT,
									new Due("ngay_nop", 0, 0, "17:00"), new Condition("gui_sep", ""), List.of(),
									List.of("báo cáo")))),
			new TemplateDefinition("Chuẩn bị cuộc họp", "Các bước trước và sau một cuộc họp.",
					List.of(field("chu_de", "Chủ đề", FieldType.TEXT, true),
							field("thoi_gian", "Thời gian họp", FieldType.DATETIME, true),
							select("hinh_thuc", "Hình thức", List.of("Trực tiếp", "Online"), "Online")),
					List.of(new TemplateRule("agenda", "Gửi agenda: {{chu_de}}",
							"Hình thức: {{hinh_thuc}} — {{thoi_gian}}", Priority.MEDIUM,
							new Due("thoi_gian", -1, 0, null), null, List.of(), List.of("họp")),
							new TemplateRule("phong", "Đặt phòng họp: {{chu_de}}", "", Priority.HIGH,
									new Due("thoi_gian", -1, 0, null), new Condition("hinh_thuc", "Trực tiếp"),
									List.of(), List.of("họp")),
							new TemplateRule("bien-ban", "Gửi biên bản họp: {{chu_de}}", "", Priority.MEDIUM,
									new Due("thoi_gian", 1, 0, null), null,
									List.of("Quyết định chính", "Việc cần làm + người phụ trách"), List.of("họp")))),
			new TemplateDefinition("Việc nhanh", "Tạo nhanh 1 task với hạn sau vài ngày.",
					List.of(field("viec", "Việc cần làm", FieldType.TEXT, true),
							field("ghi_chu", "Ghi chú", FieldType.TEXTAREA, false)),
					List.of(new TemplateRule("viec", "{{viec}}", "{{ghi_chu}}", Priority.MEDIUM,
							new Due(TemplateRule.ANCHOR_SUBMITTED, 3, 0, "17:00"), null, List.of(), List.of()))));

	// ===== English =====

	private static final List<TemplateDefinition> EN = List.of(
			new TemplateDefinition("Weekly report", "Collect the numbers, write the report and send it before the deadline.",
					List.of(field("week_no", "Week number", FieldType.NUMBER, true),
							field("due_date", "Due date", FieldType.DATE, true),
							field("project", "Project", FieldType.TEXT, true),
							field("send_manager", "Send the report to my manager", FieldType.CHECKBOX, false)),
					List.of(new TemplateRule("collect", "Collect numbers for {{project}} — week {{week_no}}", "",
							Priority.HIGH, new Due("due_date", -2, 0, "17:00"), null,
							List.of("Progress figures", "Open issues", "Plan for next week"), List.of("report")),
							new TemplateRule("write", "Write weekly report {{week_no}}", "Project: {{project}}",
									Priority.HIGH, new Due("due_date", -1, 0, "17:00"), null, List.of(),
									List.of("report")),
							new TemplateRule("send", "Send weekly report {{week_no}} to my manager", "",
									Priority.URGENT, new Due("due_date", 0, 0, "17:00"),
									new Condition("send_manager", ""), List.of(), List.of("report")))),
			new TemplateDefinition("Meeting prep", "Steps before and after a meeting.",
					List.of(field("topic", "Topic", FieldType.TEXT, true),
							field("meeting_at", "Meeting time", FieldType.DATETIME, true),
							select("format", "Format", List.of("In person", "Online"), "Online")),
					List.of(new TemplateRule("agenda", "Send agenda: {{topic}}", "Format: {{format}} — {{meeting_at}}",
							Priority.MEDIUM, new Due("meeting_at", -1, 0, null), null, List.of(), List.of("meeting")),
							new TemplateRule("room", "Book a meeting room: {{topic}}", "", Priority.HIGH,
									new Due("meeting_at", -1, 0, null), new Condition("format", "In person"),
									List.of(), List.of("meeting")),
							new TemplateRule("minutes", "Send meeting minutes: {{topic}}", "", Priority.MEDIUM,
									new Due("meeting_at", 1, 0, null), null,
									List.of("Key decisions", "Action items + owners"), List.of("meeting")))),
			new TemplateDefinition("Quick task", "Create a single task due in a few days.",
					List.of(field("task", "What needs doing", FieldType.TEXT, true),
							field("notes", "Notes", FieldType.TEXTAREA, false)),
					List.of(new TemplateRule("task", "{{task}}", "{{notes}}", Priority.MEDIUM,
							new Due(TemplateRule.ANCHOR_SUBMITTED, 3, 0, "17:00"), null, List.of(), List.of()))));

	// ===== Deutsch =====

	private static final List<TemplateDefinition> DE = List.of(
			new TemplateDefinition("Wochenbericht", "Zahlen sammeln, Bericht schreiben und vor der Frist abgeben.",
					List.of(field("kw", "Kalenderwoche", FieldType.NUMBER, true),
							field("abgabe", "Abgabetermin", FieldType.DATE, true),
							field("projekt", "Projekt", FieldType.TEXT, true),
							field("an_chef", "Bericht an Vorgesetzte senden", FieldType.CHECKBOX, false)),
					List.of(new TemplateRule("sammeln", "Zahlen für {{projekt}} sammeln — KW {{kw}}", "",
							Priority.HIGH, new Due("abgabe", -2, 0, "17:00"), null,
							List.of("Fortschrittszahlen", "Offene Probleme", "Plan für nächste Woche"),
							List.of("bericht")),
							new TemplateRule("schreiben", "Wochenbericht KW {{kw}} schreiben", "Projekt: {{projekt}}",
									Priority.HIGH, new Due("abgabe", -1, 0, "17:00"), null, List.of(),
									List.of("bericht")),
							new TemplateRule("senden", "Wochenbericht KW {{kw}} an Vorgesetzte senden", "",
									Priority.URGENT, new Due("abgabe", 0, 0, "17:00"), new Condition("an_chef", ""),
									List.of(), List.of("bericht")))),
			new TemplateDefinition("Besprechung vorbereiten", "Schritte vor und nach einer Besprechung.",
					List.of(field("thema", "Thema", FieldType.TEXT, true),
							field("termin", "Termin", FieldType.DATETIME, true),
							select("format", "Format", List.of("Vor Ort", "Online"), "Online")),
					List.of(new TemplateRule("agenda", "Agenda verschicken: {{thema}}",
							"Format: {{format}} — {{termin}}", Priority.MEDIUM, new Due("termin", -1, 0, null), null,
							List.of(), List.of("besprechung")),
							new TemplateRule("raum", "Besprechungsraum buchen: {{thema}}", "", Priority.HIGH,
									new Due("termin", -1, 0, null), new Condition("format", "Vor Ort"), List.of(),
									List.of("besprechung")),
							new TemplateRule("protokoll", "Protokoll verschicken: {{thema}}", "", Priority.MEDIUM,
									new Due("termin", 1, 0, null), null,
									List.of("Wichtige Entscheidungen", "Aufgaben + Verantwortliche"),
									List.of("besprechung")))),
			new TemplateDefinition("Schnelle Aufgabe", "Eine Aufgabe mit Frist in ein paar Tagen anlegen.",
					List.of(field("aufgabe", "Was ist zu tun", FieldType.TEXT, true),
							field("notiz", "Notiz", FieldType.TEXTAREA, false)),
					List.of(new TemplateRule("aufgabe", "{{aufgabe}}", "{{notiz}}", Priority.MEDIUM,
							new Due(TemplateRule.ANCHOR_SUBMITTED, 3, 0, "17:00"), null, List.of(), List.of()))));

	private static TemplateField field(String key, String label, FieldType type, boolean required) {
		return new TemplateField(key, label, type, required, List.of(), "");
	}

	private static TemplateField select(String key, String label, List<String> options, String defaultValue) {
		return new TemplateField(key, label, FieldType.SELECT, true, options, defaultValue);
	}

}
