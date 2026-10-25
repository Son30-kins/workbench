package io.github.son30kins.workbench.interfaces.rest.dto.request;

import java.util.List;

public record AccessPolicyRequest(List<String> allowedEmails, List<String> allowedDomains, boolean registrationOpen) {

	public AccessPolicyRequest {
		allowedEmails = allowedEmails == null ? List.of() : allowedEmails;
		allowedDomains = allowedDomains == null ? List.of() : allowedDomains;
	}

}
