package io.github.son30kins.workbench.application.admin;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.application.port.SessionRevocation;
import io.github.son30kins.workbench.application.telegram.TelegramLinkService;
import io.github.son30kins.workbench.domain.shared.DomainException;
import io.github.son30kins.workbench.domain.shared.NotFoundException;
import io.github.son30kins.workbench.domain.task.TaskRepository;
import io.github.son30kins.workbench.domain.user.Role;
import io.github.son30kins.workbench.domain.user.User;
import io.github.son30kins.workbench.domain.user.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Quản trị người dùng. Chỉ admin gọi được (SecurityConfig chặn /api/admin/**). */
@Service
@Transactional
@RequiredArgsConstructor
public class AdminService {

	private final UserRepository users;

	private final TaskRepository tasks;

	private final TelegramLinkService telegram;

	private final SessionRevocation sessions;

	public record AdminUser(UUID id, String name, String email, String image, Role role, boolean banned,
			Instant createdAt, long taskCount, boolean telegram) {
	}

	@Transactional(readOnly = true)
	public List<AdminUser> listUsers() {
		var taskCounts = tasks.countByUser();
		var linked = telegram.linkedUserIds();
		return users.findAllOrderByCreatedAt()
			.stream()
			.map(u -> new AdminUser(u.getId(), u.getName(), u.getEmail(), u.getImage(), u.getRole(), u.isBanned(),
					u.getCreatedAt(), taskCounts.getOrDefault(u.getId(), 0L), linked.contains(u.getId())))
			.toList();
	}

	/** Khoá → đăng xuất khỏi mọi thiết bị ngay. */
	public void setBanned(UUID adminId, UUID targetId, boolean banned) {
		if (adminId.equals(targetId)) {
			throw new DomainException("Không thể tự khoá tài khoản của mình");
		}
		var user = find(targetId);
		if (banned) {
			user.ban();
			sessions.revokeAll(targetId);
		}
		else {
			user.unban();
		}
	}

	public void setRole(UUID adminId, UUID targetId, Role role) {
		if (adminId.equals(targetId)) {
			throw new DomainException("Không thể tự đổi quyền của mình");
		}
		var user = find(targetId);
		if (role == Role.USER && user.isAdmin() && users.countAdmins() <= 1) {
			throw new DomainException("Cần ít nhất 1 admin");
		}
		user.changeRole(role);
	}

	private User find(UUID userId) {
		return users.findById(userId).orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
	}

}
