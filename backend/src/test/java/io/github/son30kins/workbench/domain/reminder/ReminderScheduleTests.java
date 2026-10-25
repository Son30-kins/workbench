package io.github.son30kins.workbench.domain.reminder;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import io.github.son30kins.workbench.domain.shared.TimeZones;
import io.github.son30kins.workbench.domain.task.Priority;
import io.github.son30kins.workbench.domain.user.UserSettings;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ReminderScheduleTests {

	static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");

	static final UserSettings DEFAULTS = UserSettings.DEFAULTS;

	static final UserSettings.QuietHours QUIET = DEFAULTS.quietHours(); // 22:00 → 07:00

	/** "2026-10-24T23:30" giờ VN → Instant. */
	static Instant vn(String local) {
		return LocalDateTime.parse(local).atZone(VN).toInstant();
	}

	static String fmt(Instant instant) {
		return TimeZones.format(instant, VN, "dd/MM/yyyy HH:mm");
	}

	@Nested
	class QuietHoursEnd {

		@Test
		void khungQuaNuaDem() {
			assertThat(ReminderSchedule.quietHoursEnd(vn("2026-10-24T23:30"), QUIET, VN)).map(ReminderScheduleTests::fmt)
				.hasValue("25/10/2026 07:00");
			assertThat(ReminderSchedule.quietHoursEnd(vn("2026-10-25T03:00"), QUIET, VN)).map(ReminderScheduleTests::fmt)
				.hasValue("25/10/2026 07:00");
			assertThat(ReminderSchedule.quietHoursEnd(vn("2026-10-25T07:00"), QUIET, VN)).isEmpty();
			assertThat(ReminderSchedule.quietHoursEnd(vn("2026-10-24T21:59"), QUIET, VN)).isEmpty();
		}

		@Test
		void khungTrongNgayVaKhiTat() {
			var lunch = new UserSettings.QuietHours(true, "12:00", "13:30");
			assertThat(ReminderSchedule.quietHoursEnd(vn("2026-10-24T12:15"), lunch, VN)).map(ReminderScheduleTests::fmt)
				.hasValue("24/10/2026 13:30");
			var off = new UserSettings.QuietHours(false, "12:00", "13:30");
			assertThat(ReminderSchedule.quietHoursEnd(vn("2026-10-24T12:15"), off, VN)).isEmpty();
		}

	}

	@Nested
	class AvoidQuietHours {

		final Instant now = vn("2026-10-24T10:00");

		@Test
		void doiToi7GioNeuVanTruocHan() {
			var t = ReminderSchedule.avoidQuietHours(vn("2026-10-24T23:00"), QUIET, VN, now, vn("2026-10-25T09:00"));
			assertThat(fmt(t)).isEqualTo("25/10/2026 07:00");
		}

		@Test
		void doiToi7GioSeTreHan_thiNhacSomLuc2159HomTruoc() {
			var t = ReminderSchedule.avoidQuietHours(vn("2026-10-25T05:00"), QUIET, VN, now, vn("2026-10-25T06:00"));
			assertThat(fmt(t)).isEqualTo("24/10/2026 21:59");
		}

	}

	@Nested
	class Plan {

		final Instant now = vn("2026-10-24T10:00");

		@Test
		void high_1Ngay_2GioTruocHan_vaMocQuaHan() {
			var reminders = ReminderSchedule.plan(vn("2026-10-26T17:00"), Priority.HIGH, DEFAULTS, VN, now);
			assertThat(reminders).extracting(r -> r.kind() + " " + fmt(r.fireAt()))
				.containsExactly("BEFORE_DUE 25/10/2026 17:00", "BEFORE_DUE 26/10/2026 15:00", "OVERDUE 26/10/2026 17:00");
		}

		@Test
		void boCacMocDaQua() {
			var reminders = ReminderSchedule.plan(vn("2026-10-24T11:00"), Priority.URGENT, DEFAULTS, VN, now);
			assertThat(reminders).extracting(r -> fmt(r.fireAt())).containsExactly("24/10/2026 10:45", "24/10/2026 11:00");
		}

		@Test
		void urgentBoQuaGioYenLang_mediumThiDoi() {
			var urgent = ReminderSchedule.plan(vn("2026-10-26T08:00"), Priority.URGENT, DEFAULTS, VN, now);
			assertThat(urgent).extracting(r -> fmt(r.fireAt())).contains("26/10/2026 05:00");

			// 1 ngày trước = 25/10 06:00 (trong giờ yên lặng) → 07:00
			var medium = ReminderSchedule.plan(vn("2026-10-26T06:00"), Priority.MEDIUM, DEFAULTS, VN, now);
			assertThat(fmt(medium.getFirst().fireAt())).isEqualTo("25/10/2026 07:00");
		}

		@Test
		void lowKhongNhacTruoc_khongHanThiKhongNhac() {
			var low = ReminderSchedule.plan(vn("2026-10-26T17:00"), Priority.LOW, DEFAULTS, VN, now);
			assertThat(low).extracting(ReminderSchedule.Planned::kind).containsExactly(ReminderKind.OVERDUE);
			assertThat(ReminderSchedule.plan(null, Priority.HIGH, DEFAULTS, VN, now)).isEmpty();
		}

	}

	@Test
	void nextOverdue_lapLaiSau24Gio_vaTranhGioYenLang() {
		var now = vn("2026-10-24T23:00");
		assertThat(fmt(ReminderSchedule.nextOverdue(vn("2026-10-24T23:00"), DEFAULTS, VN, now)))
			.isEqualTo("26/10/2026 07:00");
	}

	@Test
	void settingsThieuThiDungMacDinh() {
		assertThat(UserSettings.orDefaults(null)).isEqualTo(DEFAULTS);
		var incomplete = new UserSettings(new java.util.EnumMap<>(java.util.Map.of(Priority.HIGH, List.of(60))),
				DEFAULTS.quietHours(), DEFAULTS.digest(), 24);
		assertThat(UserSettings.orDefaults(incomplete)).isEqualTo(DEFAULTS);
	}

}
