package io.github.son30kins.workbench.interfaces.rest;

import java.util.LinkedHashMap;
import java.util.List;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import io.github.son30kins.workbench.application.i18n.Translator;
import io.github.son30kins.workbench.domain.shared.DomainException;
import io.github.son30kins.workbench.domain.shared.NotFoundException;
import io.github.son30kins.workbench.domain.shared.ValidationException;
import io.github.son30kins.workbench.domain.template.InvalidFormValuesException;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Nơi DUY NHẤT quyết định exception nào thành HTTP status nào (domain không biết HTTP).
 * Trả về RFC 9457 Problem Details; lỗi kiểm tra dữ liệu có thêm {@code errors: [{path, message}]}.
 * Mã thông điệp của domain được dịch sang ngôn ngữ của request (cookie / Accept-Language) tại đây.
 * Không bao giờ trả stack trace hay thông điệp nội bộ cho client.
 */
@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	private final Translator translator;

	/** Lỗi theo từng ô gửi về client — câu chữ đã dịch. */
	record ViolationResponse(String path, String message) {
	}

	@ExceptionHandler(NotFoundException.class)
	ProblemDetail notFound(NotFoundException ex) {
		return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, translator.get(ex.translatable()));
	}

	@ExceptionHandler(ValidationException.class)
	ProblemDetail validation(ValidationException ex) {
		return withErrors(translator.get(ex.translatable()), ex.violations()
			.stream()
			.map(v -> new ViolationResponse(v.path(), translator.get(v.message())))
			.toList());
	}

	@ExceptionHandler(InvalidFormValuesException.class)
	ProblemDetail invalidFormValues(InvalidFormValuesException ex) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_CONTENT,
				translator.get(ex.translatable()));
		var fieldErrors = new LinkedHashMap<String, String>();
		ex.fieldErrors().forEach((key, message) -> fieldErrors.put(key, translator.get(message)));
		problem.setProperty("fieldErrors", fieldErrors);
		return problem;
	}

	/** Vi phạm quy tắc nghiệp vụ còn lại → 400 với thông điệp theo ngôn ngữ người dùng. */
	@ExceptionHandler(DomainException.class)
	ProblemDetail domain(DomainException ex) {
		return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, translator.get(ex.translatable()));
	}

	/** Lý do có thể là mã thông điệp ("error.unauthorized") — không có trong file dịch thì giữ nguyên. */
	@ExceptionHandler(ResponseStatusException.class)
	ProblemDetail status(ResponseStatusException ex) {
		return ProblemDetail.forStatusAndDetail(ex.getStatusCode(),
				ex.getReason() == null ? null : translator.get(ex.getReason()));
	}

	@ExceptionHandler(Exception.class)
	ProblemDetail unexpected(Exception ex) {
		log.error("Lỗi không mong đợi", ex);
		return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, translator.get("error.unexpected"));
	}

	/** {@code @Valid} thất bại → danh sách lỗi; path "fields[0].key" đổi thành "fields.0.key". */
	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		List<ViolationResponse> violations = ex.getBindingResult()
			.getFieldErrors()
			.stream()
			.map(GlobalExceptionHandler::toViolation)
			.toList();
		var message = violations.isEmpty() ? translator.get("error.validation") : violations.getFirst().message();
		return ResponseEntity.badRequest().body(withErrors(message, violations));
	}

	/** JSON sai cú pháp hoặc giá trị enum lạ. */
	@Override
	protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		return ResponseEntity.badRequest()
			.body(ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, translator.get("error.unreadable")));
	}

	private static ProblemDetail withErrors(String message, List<ViolationResponse> violations) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, message);
		problem.setProperty("errors", violations);
		return problem;
	}

	/** Câu chữ của Bean Validation đã được dịch sẵn (MessageSource + ngôn ngữ của request). */
	private static ViolationResponse toViolation(FieldError error) {
		return new ViolationResponse(error.getField().replaceAll("\\[(\\d+)]", ".$1"), error.getDefaultMessage());
	}

}
