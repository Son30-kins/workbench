package io.github.son30kins.workbench;

import java.time.ZoneId;
import java.util.UUID;

import io.github.son30kins.workbench.domain.user.Role;
import io.github.son30kins.workbench.domain.user.User;
import io.github.son30kins.workbench.domain.user.UserContext;
import io.github.son30kins.workbench.domain.user.UserRepository;

import org.springframework.boot.test.context.TestComponent;

/** Tạo người dùng thử với email ngẫu nhiên (các test không giẫm lên dữ liệu của nhau). */
@TestComponent
public class TestFixtures {

	public static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");

	private final UserRepository users;

	TestFixtures(UserRepository users) {
		this.users = users;
	}

	public User user(Role role) {
		var id = UUID.randomUUID().toString();
		return users.save(new User("google-" + id, id + "@example.com", "Người dùng " + id.substring(0, 4), null, role, VN));
	}

	public UserContext context(Role role) {
		return UserContext.of(user(role));
	}

}
