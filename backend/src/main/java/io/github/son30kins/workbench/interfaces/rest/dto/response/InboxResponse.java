package io.github.son30kins.workbench.interfaces.rest.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import io.github.son30kins.workbench.application.notification.NotificationService;

public record InboxResponse(List<Item> items, long unread) {

	public record Item(UUID id, UUID taskId, String title, String body, Instant readAt, Instant createdAt) {
	}

	public static InboxResponse from(NotificationService.Inbox inbox) {
		return new InboxResponse(inbox.items()
			.stream()
			.map(n -> new Item(n.getId(), n.getTaskId(), n.getTitle(), n.getBody(), n.getReadAt(), n.getCreatedAt()))
			.toList(), inbox.unread());
	}

}
