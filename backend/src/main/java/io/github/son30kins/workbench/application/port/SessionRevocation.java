package io.github.son30kins.workbench.application.port;

import java.util.UUID;

/** Port ra ngoài: đăng xuất một người dùng khỏi mọi thiết bị (hiện thực bằng Spring Session). */
public interface SessionRevocation {

	void revokeAll(UUID userId);

}
