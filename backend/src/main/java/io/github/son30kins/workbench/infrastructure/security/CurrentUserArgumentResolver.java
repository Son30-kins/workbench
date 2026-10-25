package io.github.son30kins.workbench.infrastructure.security;

import java.util.List;


import org.springframework.context.annotation.Configuration;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Cho phép controller khai báo {@code CurrentUser user} như một tham số. */
@Configuration(proxyBeanMethods = false)
class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver, WebMvcConfigurer {

	@Override
	public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
		resolvers.add(this);
	}

	@Override
	public boolean supportsParameter(MethodParameter parameter) {
		return parameter.getParameterType() == CurrentUser.class;
	}

	@Override
	public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
			NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
		var user = webRequest.getAttribute(CurrentUser.REQUEST_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
		if (user == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Chưa đăng nhập");
		}
		return user;
	}

}
