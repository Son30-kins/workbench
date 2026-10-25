package io.github.son30kins.workbench.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

import io.github.son30kins.workbench.domain.template.Template;
import io.github.son30kins.workbench.domain.template.TemplateRepository;
import io.github.son30kins.workbench.domain.template.TemplateRun;

import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
class TemplateRepositoryAdapter implements TemplateRepository {

	private final TemplateSpringDataRepository templates;

	private final TemplateRunSpringDataRepository runs;

	@Override
	public Template save(Template template) {
		return templates.save(template);
	}

	@Override
	public List<Template> findByUser(UUID userId) {
		return templates.findByUserIdOrderByNameAsc(userId);
	}

	@Override
	public Optional<Template> findOwned(UUID id, UUID userId) {
		return templates.findByIdAndUserId(id, userId);
	}

	@Override
	public boolean deleteOwned(UUID id, UUID userId) {
		return templates.deleteByIdAndUserId(id, userId) > 0;
	}

	@Override
	public TemplateRun saveRun(TemplateRun run) {
		return runs.save(run);
	}

	@Override
	public List<TemplateRun> findRecentRuns(UUID userId, int limit) {
		return runs.findByUserIdOrderByCreatedAtDesc(userId, Limit.of(limit));
	}

}
