package io.github.son30kins.workbench.interfaces.rest;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.application.notification.NotificationService;
import io.github.son30kins.workbench.infrastructure.security.CurrentUser;
import io.github.son30kins.workbench.interfaces.rest.dto.response.InboxResponse;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
class NotificationController {

	private final NotificationService notifications;

	@GetMapping
	InboxResponse inbox(CurrentUser user) {
		return InboxResponse.from(notifications.inbox(user.id()));
	}

	@PostMapping("/read-all")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void markAllRead(CurrentUser user) {
		notifications.markAllRead(user.id());
	}

}
