package io.github.son30kins.workbench.domain.template;

import java.util.List;

import io.github.son30kins.workbench.domain.task.Priority;
import io.github.son30kins.workbench.domain.template.TemplateRule.Condition;
import io.github.son30kins.workbench.domain.template.TemplateRule.Due;

/** Ba form mẫu tự thêm cho mỗi tài khoản mới. */
public final class DefaultTemplates {

	private DefaultTemplates() {
	}

	static final TemplateDefinition WEEKLY_REPORT = new TemplateDefinition("Báo cáo tuần",
			"Thu thập số liệu, viết và gửi báo cáo trước hạn nộp.",
			List.of(field("tuan", "Tuần số", FieldType.NUMBER, true), field("ngay_nop", "Hạn nộp", FieldType.DATE, true),
					field("du_an", "Dự án", FieldType.TEXT, true),
					field("gui_sep", "Gửi báo cáo cho quản lý", FieldType.CHECKBOX, false)),
			List.of(new TemplateRule("thu-thap", "Thu thập số liệu {{du_an}} — tuần {{tuan}}", "", Priority.HIGH,
					new Due("ngay_nop", -2, 0, "17:00"), null,
					List.of("Số liệu tiến độ", "Vấn đề tồn đọng", "Kế hoạch tuần sau"), List.of("báo cáo")),
					new TemplateRule("viet", "Viết báo cáo tuần {{tuan}}", "Dự án: {{du_an}}", Priority.HIGH,
							new Due("ngay_nop", -1, 0, "17:00"), null, List.of(), List.of("báo cáo")),
					new TemplateRule("gui", "Gửi báo cáo tuần {{tuan}} cho quản lý", "", Priority.URGENT,
							new Due("ngay_nop", 0, 0, "17:00"), new Condition("gui_sep", ""), List.of(),
							List.of("báo cáo"))));

	static final TemplateDefinition MEETING = new TemplateDefinition("Chuẩn bị cuộc họp",
			"Các bước trước và sau một cuộc họp.",
			List.of(field("chu_de", "Chủ đề", FieldType.TEXT, true),
					field("thoi_gian", "Thời gian họp", FieldType.DATETIME, true),
					new TemplateField("hinh_thuc", "Hình thức", FieldType.SELECT, true, List.of("Trực tiếp", "Online"),
							"Online")),
			List.of(new TemplateRule("agenda", "Gửi agenda: {{chu_de}}", "Hình thức: {{hinh_thuc}} — {{thoi_gian}}",
					Priority.MEDIUM, new Due("thoi_gian", -1, 0, null), null, List.of(), List.of("họp")),
					new TemplateRule("phong", "Đặt phòng họp: {{chu_de}}", "", Priority.HIGH,
							new Due("thoi_gian", -1, 0, null), new Condition("hinh_thuc", "Trực tiếp"), List.of(),
							List.of("họp")),
					new TemplateRule("bien-ban", "Gửi biên bản họp: {{chu_de}}", "", Priority.MEDIUM,
							new Due("thoi_gian", 1, 0, null), null,
							List.of("Quyết định chính", "Việc cần làm + người phụ trách"), List.of("họp"))));

	static final TemplateDefinition QUICK_TASK = new TemplateDefinition("Việc nhanh",
			"Tạo nhanh 1 task với hạn sau vài ngày.",
			List.of(field("viec", "Việc cần làm", FieldType.TEXT, true),
					field("ghi_chu", "Ghi chú", FieldType.TEXTAREA, false)),
			List.of(new TemplateRule("viec", "{{viec}}", "{{ghi_chu}}", Priority.MEDIUM,
					new Due(TemplateRule.ANCHOR_SUBMITTED, 3, 0, "17:00"), null, List.of(), List.of())));

	public static final List<TemplateDefinition> ALL = List.of(WEEKLY_REPORT, MEETING, QUICK_TASK);

	private static TemplateField field(String key, String label, FieldType type, boolean required) {
		return new TemplateField(key, label, type, required, List.of(), "");
	}

}
