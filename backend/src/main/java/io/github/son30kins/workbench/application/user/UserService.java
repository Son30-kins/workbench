package io.github.son30kins.workbench.application.user;

import java.time.ZoneId;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.application.task.TaskService;
import io.github.son30kins.workbench.domain.shared.DomainException;
import io.github.son30kins.workbench.domain.shared.NotFoundException;
import io.github.son30kins.workbench.domain.shared.TimeZones;
import io.github.son30kins.workbench.domain.user.User;
import io.github.son30kins.workbench.domain.user.UserRepository;
import io.github.son30kins.workbench.domain.user.UserSettings;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

	private final UserRepository users;

	private final TaskService tasks;

	@Transactional(readOnly = true)
	public java.util.Optional<User> find(UUID userId) {
		return users.findById(userId);
	}

	/** Lưu múi giờ + cài đặt nhắc việc, rồi tính lại lịch nhắc cho các task đang mở. */
	public User updatePreferences(UUID userId, String timezone, UserSettings settings) {
		if (!TimeZones.isValidZone(timezone)) {
			throw new DomainException("Múi giờ không hợp lệ");
		}
		var user = users.findById(userId).orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
		user.updatePreferences(ZoneId.of(timezone), settings);
		tasks.rescheduleOpenTasks(user.toContext());
		return user;
	}

}
