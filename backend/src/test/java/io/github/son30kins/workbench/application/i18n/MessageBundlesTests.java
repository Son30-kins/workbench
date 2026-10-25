package io.github.son30kins.workbench.application.i18n;

import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.MessageFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Properties;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

/** Ba file dịch phải đủ khoá như nhau và cú pháp MessageFormat / mẫu ngày phải hợp lệ. */
class MessageBundlesTests {

	@ParameterizedTest
	@ValueSource(strings = { "messages_en.properties", "messages_de.properties" })
	void banDichCoDuKhoaNhuTiengViet(String file) throws IOException {
		assertThat(load(file).stringPropertyNames()).isEqualTo(load("messages.properties").stringPropertyNames());
	}

	@ParameterizedTest
	@ValueSource(strings = { "messages.properties", "messages_en.properties", "messages_de.properties" })
	void moiChuoiDungCuPhap(String file) throws IOException {
		var bundle = load(file);
		for (var key : bundle.stringPropertyNames()) {
			var pattern = bundle.getProperty(key);
			assertThatCode(() -> {
				var formatted = new MessageFormat(pattern, Locale.ROOT).format(new Object[] { 1, "x" });
				if (key.startsWith("format.")) {
					DateTimeFormatter.ofPattern(formatted);
				}
			}).as("%s: %s", file, key).doesNotThrowAnyException();
		}
	}

	@Test
	void nhayDonTrongTiengAnhDuocGiuNguyen() throws IOException {
		var pattern = load("messages_en.properties").getProperty("error.admin.selfBan");
		assertThat(new MessageFormat(pattern, Locale.ENGLISH).format(new Object[0]))
			.isEqualTo("You can't ban your own account");
	}

	private static Properties load(String file) throws IOException {
		var properties = new Properties();
		try (var in = MessageBundlesTests.class.getClassLoader().getResourceAsStream(file)) {
			assertThat(in).as(file).isNotNull();
			properties.load(new InputStreamReader(in, StandardCharsets.UTF_8));
		}
		return properties;
	}

}
