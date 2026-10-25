package io.github.son30kins.workbench.infrastructure.persistence;

import java.util.List;
import java.util.UUID;

import io.github.son30kins.workbench.domain.template.TemplateRun;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

interface TemplateRunSpringDataRepository extends JpaRepository<TemplateRun, UUID> {

	List<TemplateRun> findByUserIdOrderByCreatedAtDesc(UUID userId, Limit limit);

}
