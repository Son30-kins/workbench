package io.github.son30kins.workbench.domain.template;

import java.time.Instant;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import io.github.son30kins.workbench.domain.shared.Violation;
import io.github.son30kins.workbench.domain.shared.TimeZones;
import io.github.son30kins.workbench.domain.task.Priority;
import io.github.son30kins.workbench.domain.template.TemplateRule.Condition;
import io.github.son30kins.workbench.domain.template.TemplateRule.Due;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TemplateEngineTests {

	static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");

	static final Instant NOW = Instant.parse("2026-10-24T03:00:00Z"); // 10:00 giờ VN, thứ Bảy

	static final List<TemplateField> FIELDS = List.of(
			new TemplateField("tuan", "Tuần số", FieldType.NUMBER, true, List.of(), ""),
			new TemplateField("ngay_nop", "Hạn nộp", FieldType.DATE, true, List.of(), ""),
			new TemplateField("du_an", "Dự án", FieldType.SELECT, true, List.of("A", "B"), ""),
			new TemplateField("gui_sep", "Gửi sếp", FieldType.CHECKBOX, false, List.of(), ""));

	static TemplateRule rule(String id, String title, Due due) {
		return new TemplateRule(id, title, "", Priority.HIGH, due, null, List.of(), List.of());
	}

	static final List<TemplateRule> WEEKLY_REPORT = List.of(
			rule("r1", "Thu thập số liệu dự án {{du_an}} — tuần {{tuan}}", new Due("ngay_nop", -2, 0, "17:00")),
			rule("r2", "Viết báo cáo tuần {{tuan}}", new Due("ngay_nop", -1, 0, "17:00")),
			new TemplateRule("r3", "Gửi báo cáo tuần {{tuan}} cho sếp", "", Priority.URGENT,
					new Due("ngay_nop", 0, 0, "17:00"), new Condition("gui_sep", ""), List.of(), List.of()));

	static String fmt(Instant instant) {
		return TimeZones.format(instant, VN, "dd/MM/yyyy HH:mm");
	}

	@Nested
	class ValidateValues {

		@Test
		void baoLoiBatBuoc_So_LuaChonKhongHopLe() {
			var result = TemplateEngine.validateValues(FIELDS, Map.of("tuan", "abc", "ngay_nop", "", "du_an", "Z"));
			assertThat(result.errors()).isEqualTo(
					Map.of("tuan", "Phải là số", "ngay_nop", "Bắt buộc", "du_an", "Lựa chọn không hợp lệ"));
		}

		@Test
		void checkboxNhanOnTuFormHtml() {
			var result = TemplateEngine.validateValues(FIELDS,
					Map.of("tuan", "43", "ngay_nop", "2026-10-31", "du_an", "A", "gui_sep", "on"));
			assertThat(result.errors()).isEmpty();
			assertThat(result.values()).containsEntry("gui_sep", true);
		}

		@Test
		void ngayKhongTonTaiBiTuChoi() {
			var result = TemplateEngine.validateValues(FIELDS,
					Map.of("tuan", "1", "ngay_nop", "2026-02-30", "du_an", "A"));
			assertThat(result.errors()).containsEntry("ngay_nop", "Ngày không hợp lệ");
		}

	}

	@Nested
	class Plan {

		@Test
		void sinhDung3TaskVoiHanTuongDoiTheoNgayNop_gioVN() {
			var values = TemplateEngine
				.validateValues(FIELDS, Map.of("tuan", "43", "ngay_nop", "2026-10-31", "du_an", "A", "gui_sep", "on"))
				.values();
			var plan = TemplateEngine.plan(FIELDS, WEEKLY_REPORT, values, VN, NOW);

			assertThat(plan.warnings()).isEmpty();
			assertThat(plan.tasks()).extracting(TemplateEngine.PlannedTask::title)
				.containsExactly("Thu thập số liệu dự án A — tuần 43", "Viết báo cáo tuần 43", "Gửi báo cáo tuần 43 cho sếp");
			assertThat(plan.tasks()).extracting(t -> fmt(t.dueAt()))
				.containsExactly("29/10/2026 17:00", "30/10/2026 17:00", "31/10/2026 17:00");
			// 17:00 giờ VN = 10:00 UTC
			assertThat(plan.tasks().get(2).dueAt()).isEqualTo(Instant.parse("2026-10-31T10:00:00Z"));
			assertThat(plan.tasks().get(2).priority()).isEqualTo(Priority.URGENT);
		}

		@Test
		void boTaskCoDieuKienKhiCheckboxKhongTick() {
			var values = TemplateEngine.validateValues(FIELDS, Map.of("tuan", "43", "ngay_nop", "2026-10-31", "du_an", "B"))
				.values();
			assertThat(TemplateEngine.plan(FIELDS, WEEKLY_REPORT, values, VN, NOW).tasks()).hasSize(2);
		}

		@Test
		void mocLaNgay_khongDatGio_thiHan2359() {
			var plan = TemplateEngine.plan(FIELDS, List.of(rule("x", "X", new Due("ngay_nop", 0, 0, null))),
					Map.of("ngay_nop", "2026-11-02"), VN, NOW);
			assertThat(fmt(plan.tasks().getFirst().dueAt())).isEqualTo("02/11/2026 23:59");
		}

		@Test
		void mocLucDienForm_cong3Ngay2Gio() {
			var plan = TemplateEngine.plan(List.of(),
					List.of(rule("x", "X", new Due(TemplateRule.ANCHOR_SUBMITTED, 3, 2, null))), Map.of(), VN, NOW);
			assertThat(fmt(plan.tasks().getFirst().dueAt())).isEqualTo("27/10/2026 12:00");
		}

		@Test
		void khongCoMoc_thiKhongCoHan_mocTrong_thiCanhBao() {
			var plan = TemplateEngine.plan(FIELDS, List.of(rule("a", "Không hạn", new Due(null, 0, 0, null)),
					rule("b", "Thiếu ngày", new Due("ngay_nop", 0, 0, null))), Map.of("ngay_nop", ""), VN, NOW);
			assertThat(plan.tasks()).extracting(TemplateEngine.PlannedTask::dueAt).containsOnlyNulls();
			assertThat(plan.warnings()).hasSize(1);
		}

		@Test
		void canhBaoKhiHanDaQua() {
			var plan = TemplateEngine.plan(FIELDS, List.of(rule("x", "Cũ", new Due("ngay_nop", 0, 0, null))),
					Map.of("ngay_nop", "2026-10-01"), VN, NOW);
			assertThat(plan.warnings().getFirst()).contains("quá khứ");
		}

	}

	@Test
	void renderText_dinhDangNgay_checkbox_vaBienCoSan() {
		var values = new HashMap<String, Object>(Map.of("ngay_nop", "2026-10-31", "gui_sep", false));
		var out = TemplateEngine.renderText("{{ngay_nop}} | {{gui_sep}} | {{today}} | tuần {{week}} | {{khong_co}}",
				FIELDS, values, VN, NOW);
		assertThat(out).isEqualTo("31/10/2026 | Không | 24/10/2026 | tuần 43 | ");
	}

	@Nested
	class Validator {

		@Test
		void chanMaTrung_bienLa_vaMocHanKhongPhaiTruongNgay() {
			var violations = TemplateValidator.validate(List.of(FIELDS.get(0), FIELDS.get(0)),
					List.of(rule("r", "{{la}}", new Due("tuan", 0, 0, null))));
			assertThat(violations).extracting(Violation::message)
				.anyMatch(m -> m.contains("bị trùng"))
				.anyMatch(m -> m.contains("{{la}}"))
				.anyMatch(m -> m.contains("Mốc hạn"));
			assertThat(violations).extracting(Violation::path).contains("fields.1.key", "rules.0.due.anchor");
		}

		@Test
		void chapNhanTemplateBaoCaoTuanHopLe() {
			assertThat(TemplateValidator.validate(FIELDS, WEEKLY_REPORT)).isEmpty();
		}

		@Test
		void boFormMacDinhHopLe() {
			DefaultTemplates.ALL
				.forEach(t -> assertThat(TemplateValidator.validate(t.fields(), t.rules())).as(t.name()).isEmpty());
		}

	}

}
