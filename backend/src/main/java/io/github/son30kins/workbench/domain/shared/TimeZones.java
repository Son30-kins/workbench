package io.github.son30kins.workbench.domain.shared;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Tính toán ngày giờ theo múi giờ của người dùng. Database luôn lưu {@link Instant} (UTC);
 * "ngày", "giờ trên đồng hồ" chỉ có nghĩa khi gắn với một {@link ZoneId}.
 */
public final class TimeZones {

	public static final Locale VI = Locale.forLanguageTag("vi-VN");

	private TimeZones() {
	}

	/** Ngày + giờ trên đồng hồ ở múi giờ {@code zone} → thời điểm. */
	public static Instant fromLocal(LocalDate date, LocalTime time, ZoneId zone) {
		return date.atTime(time).atZone(zone).toInstant();
	}

	public static Instant fromLocal(LocalDateTime dateTime, ZoneId zone) {
		return dateTime.atZone(zone).toInstant();
	}

	public static LocalDate localDate(Instant instant, ZoneId zone) {
		return instant.atZone(zone).toLocalDate();
	}

	/** Cộng {@code days} ngày theo lịch địa phương, giữ nguyên giờ trên đồng hồ. */
	public static Instant addLocalDays(Instant instant, long days, ZoneId zone) {
		return instant.atZone(zone).plusDays(days).toInstant();
	}

	/** Đặt giờ trên đồng hồ, giữ nguyên ngày địa phương của {@code instant}. */
	public static Instant setLocalTime(Instant instant, LocalTime time, ZoneId zone) {
		return fromLocal(localDate(instant, zone), time, zone);
	}

	public static Instant startOfLocalDay(Instant instant, ZoneId zone) {
		return localDate(instant, zone).atStartOfDay(zone).toInstant();
	}

	public static String format(Instant instant, ZoneId zone, String pattern) {
		return format(instant, zone, pattern, VI);
	}

	/** Định dạng theo ngôn ngữ — tên thứ, tháng ("Montag", "Monday", "Thứ Hai"). */
	public static String format(Instant instant, ZoneId zone, String pattern, Locale locale) {
		return DateTimeFormatter.ofPattern(pattern, locale).format(instant.atZone(zone));
	}

	public static boolean isValidZone(String zone) {
		try {
			ZoneId.of(zone);
			return true;
		}
		catch (DateTimeException ex) {
			return false;
		}
	}

}
