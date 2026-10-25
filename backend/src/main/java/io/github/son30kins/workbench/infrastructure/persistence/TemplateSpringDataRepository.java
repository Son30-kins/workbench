package io.github.son30kins.workbench.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import io.github.son30kins.workbench.domain.template.Template;

import org.springframework.data.jpa.repository.JpaRepository;

interface TemplateSpringDataRepository extends JpaRepository<Template, UUID> {

	List<Template> findByUserIdOrderByNameAsc(UUID userId);

	Optional<Template> findByIdAndUserId(UUID id, UUID userId);

	long deleteByIdAndUserId(UUID id, UUID userId);

}
