package io.github.son30kins.workbench.interfaces.rest;

import java.util.UUID;

import jakarta.servlet.http.Cookie;

import io.github.son30kins.workbench.IntegrationTest;
import io.github.son30kins.workbench.TestFixtures;
import io.github.son30kins.workbench.domain.shared.Language;
import io.github.son30kins.workbench.domain.user.Role;
import io.github.son30kins.workbench.domain.user.UserRepository;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import static io.github.son30kins.workbench.infrastructure.security.ApiSecurityTests.loggedIn;
import static org.assertj.core.api.Assertions.assertThat;

/** Ngôn ngữ của API: cookie WORKBENCH_LANG → Accept-Language → tiếng Việt; đổi ngôn ngữ của tài khoản. */
@IntegrationTest
@AutoConfigureMockMvc
class I18nApiTests {

	/** Header chống CSRF mà API yêu cầu cho request thay đổi dữ liệu. */
	static final String REQUESTED_BY = "X-Requested-By";

	@Autowired
	MockMvcTester mvc;

	@Autowired
	TestFixtures fixtures;

	@Autowired
	UserRepository users;

	@Test
	void loiTheoAcceptLanguage() {
		var user = fixtures.user(Role.USER);
		mvc.get().uri("/api/tasks/" + UUID.randomUUID()).with(loggedIn(user)).header(HttpHeaders.ACCEPT_LANGUAGE, "de-DE,de;q=0.9")
			.assertThat().hasStatus(HttpStatus.NOT_FOUND)
			.bodyJson().extractingPath("$.detail").isEqualTo("Aufgabe nicht gefunden");
	}

	@Test
	void cookieThangAcceptLanguage() {
		var user = fixtures.user(Role.USER);
		mvc.get().uri("/api/tasks/" + UUID.randomUUID()).with(loggedIn(user)).header(HttpHeaders.ACCEPT_LANGUAGE, "de")
			.cookie(new Cookie("WORKBENCH_LANG", "en"))
			.assertThat().bodyJson().extractingPath("$.detail").isEqualTo("Task not found");
	}

	@Test
	void ngonNguKhongHoTro_thiTiengViet() {
		var user = fixtures.user(Role.USER);
		mvc.get().uri("/api/tasks/" + UUID.randomUUID()).with(loggedIn(user)).header(HttpHeaders.ACCEPT_LANGUAGE, "fr-FR")
			.assertThat().bodyJson().extractingPath("$.detail").isEqualTo("Không tìm thấy task");
	}

	@Test
	void loiBeanValidationCungDuocDich() {
		var user = fixtures.user(Role.USER);
		mvc.post().uri("/api/tasks").with(loggedIn(user)).header(REQUESTED_BY, "test")
			.header(HttpHeaders.ACCEPT_LANGUAGE, "en").contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"title":" ","priority":"HIGH","status":"TODO"}""")
			.assertThat().hasStatus(HttpStatus.BAD_REQUEST)
			.bodyJson().extractingPath("$.errors[0].message").isEqualTo("Enter a title");
	}

	@Test
	void doiNgonNguCuaTaiKhoan() {
		var user = fixtures.user(Role.USER);
		mvc.put().uri("/api/me/language").with(loggedIn(user)).header(REQUESTED_BY, "test")
			.contentType(MediaType.APPLICATION_JSON).content("""
					{"language":"de"}""")
			.assertThat().hasStatusOk().bodyJson().extractingPath("$.language").isEqualTo("de");
		assertThat(users.findById(user.getId()).orElseThrow().getLanguage()).isEqualTo(Language.DE);
		mvc.get().uri("/api/me").with(loggedIn(user))
			.assertThat().bodyJson().extractingPath("$.language").isEqualTo("de");
	}

	@Test
	void ngonNguLa_thi400() {
		var user = fixtures.user(Role.USER);
		mvc.put().uri("/api/me/language").with(loggedIn(user)).header(REQUESTED_BY, "test")
			.contentType(MediaType.APPLICATION_JSON).content("""
					{"language":"fr"}""")
			.assertThat().hasStatus(HttpStatus.BAD_REQUEST);
	}

}
