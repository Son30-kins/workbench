package io.github.son30kins.workbench.infrastructure.security;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import io.github.son30kins.workbench.IntegrationTest;
import io.github.son30kins.workbench.TestFixtures;
import io.github.son30kins.workbench.domain.user.Role;
import io.github.son30kins.workbench.domain.user.User;
import io.github.son30kins.workbench.domain.user.UserRepository;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;

/** Kiểm tra lớp bảo mật qua HTTP thật (MockMvc): đăng nhập, phân quyền admin, header chống CSRF, khoá tài khoản. */
@IntegrationTest
@AutoConfigureMockMvc
public class ApiSecurityTests {

	@Autowired
	MockMvcTester mvc;

	@Autowired
	TestFixtures fixtures;

	@Autowired
	UserRepository users;

	/** Giả lập phiên đăng nhập Google của {@code user}. */
	public static RequestPostProcessor loggedIn(User user) {
		var idToken = new OidcIdToken("token", Instant.now(), Instant.now().plusSeconds(3600),
				Map.of("sub", user.getGoogleSubject(), "email", user.getEmail()));
		var principal = new WorkbenchOidcUser(user.getId(), List.of(new SimpleGrantedAuthority(Role.USER.authority())),
				idToken, new OidcUserInfo(Map.of("sub", user.getGoogleSubject())));
		return oidcLogin().oidcUser(principal);
	}

	@Test
	void chuaDangNhap_thi401_khongChuyenHuongSangGoogle() {
		mvc.get().uri("/api/me").assertThat().hasStatus(HttpStatus.UNAUTHORIZED);
	}

	@Test
	void dangNhapThiDocDuocThongTinCuaMinh() {
		var user = fixtures.user(Role.USER);
		mvc.get().uri("/api/me").with(loggedIn(user)).assertThat().hasStatusOk()
			.bodyJson().extractingPath("$.email").isEqualTo(user.getEmail());
	}

	@Test
	void nguoiDungThuongKhongVaoDuocTrangQuanTri() {
		var user = fixtures.user(Role.USER);
		mvc.get().uri("/api/admin/users").with(loggedIn(user)).assertThat().hasStatus(HttpStatus.FORBIDDEN);
	}

	@Test
	void quyenLayTheoDatabase_doiQuyenCoHieuLucNgay() {
		var user = fixtures.user(Role.ADMIN); // principal trong phiên ghi ROLE_USER, DB là ADMIN
		mvc.get().uri("/api/admin/users").with(loggedIn(user)).assertThat().hasStatusOk();
	}

	@Test
	void thieuHeaderXRequestedBy_thiTuChoiThayDoiDuLieu() {
		var user = fixtures.user(Role.USER);
		var body = """
				{"title":"Việc mới","priority":"HIGH","status":"TODO"}""";
		mvc.post().uri("/api/tasks").with(loggedIn(user)).contentType(MediaType.APPLICATION_JSON).content(body)
			.assertThat().hasStatus(HttpStatus.FORBIDDEN);
		mvc.post().uri("/api/tasks").with(loggedIn(user)).header(RequestedByFilter.HEADER, "test")
			.contentType(MediaType.APPLICATION_JSON).content(body)
			.assertThat().hasStatus(HttpStatus.CREATED);
	}

	/** Danh sách trả kèm task con — entity → DTO ngoài transaction không được lỗi lazy loading. */
	@Test
	void danhSachTaskTraKemTaskCon() {
		var user = fixtures.user(Role.USER);
		mvc.post().uri("/api/tasks").with(loggedIn(user)).header(RequestedByFilter.HEADER, "test")
			.contentType(MediaType.APPLICATION_JSON).content("""
					{"title":"Có việc con","priority":"HIGH","status":"TODO","due":"2030-01-02T17:00",
					 "subtasks":[{"title":"Bước 1","done":true},{"title":"Bước 2","done":false}]}""")
			.assertThat().hasStatus(HttpStatus.CREATED);
		var response = mvc.get().uri("/api/tasks").with(loggedIn(user)).assertThat().hasStatusOk().bodyJson();
		response.extractingPath("$[0].subtasks.length()").isEqualTo(2);
		// 17:00 giờ VN = 10:00 UTC
		response.extractingPath("$[0].dueAt").isEqualTo("2030-01-02T10:00:00Z");
	}

	@Test
	void duLieuSai_thiTraVeDanhSachLoiTheoTruong() {
		var user = fixtures.user(Role.USER);
		mvc.post().uri("/api/tasks").with(loggedIn(user)).header(RequestedByFilter.HEADER, "test")
			.contentType(MediaType.APPLICATION_JSON).content("""
					{"title":"  ","priority":"HIGH","status":"TODO"}""")
			.assertThat().hasStatus(HttpStatus.BAD_REQUEST)
			.bodyJson().extractingPath("$.errors[0].path").isEqualTo("title");
	}

	@Test
	void taiKhoanBiKhoa_thiPhienKhongConHieuLuc() {
		var user = fixtures.user(Role.USER);
		user.ban();
		users.save(user);
		mvc.get().uri("/api/me").with(loggedIn(user)).assertThat().hasStatus(HttpStatus.UNAUTHORIZED);
	}

}
