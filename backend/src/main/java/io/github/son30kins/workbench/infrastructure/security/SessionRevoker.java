package io.github.son30kins.workbench.infrastructure.security;

import java.util.UUID;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.application.port.SessionRevocation;

import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.session.Session;
import org.springframework.stereotype.Component;

/**
 * Hiện thực port {@link SessionRevocation} bằng Spring Session JDBC: tìm mọi phiên có PRINCIPAL_NAME = id
 * người dùng (xem {@link WorkbenchOidcUser#getName()}) rồi xoá.
 */
@Component
@RequiredArgsConstructor
class SessionRevoker implements SessionRevocation {

	private final FindByIndexNameSessionRepository<? extends Session> sessions;

	@Override
	public void revokeAll(UUID userId) {
		sessions.findByPrincipalName(userId.toString()).keySet().forEach(sessions::deleteById);
	}

}
