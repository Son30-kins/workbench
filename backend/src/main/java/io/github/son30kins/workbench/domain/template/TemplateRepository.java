package io.github.son30kins.workbench.domain.template;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Port lưu trữ form mẫu và lịch sử điền form. Mọi phương thức lọc theo chủ sở hữu. */
public interface TemplateRepository {

	Template save(Template template);

	List<Template> findByUser(UUID userId);

	Optional<Template> findOwned(UUID id, UUID userId);

	boolean deleteOwned(UUID id, UUID userId);

	TemplateRun saveRun(TemplateRun run);

	List<TemplateRun> findRecentRuns(UUID userId, int limit);

}
