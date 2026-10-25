package io.github.son30kins.workbench.interfaces.rest;

import java.util.List;

import lombok.extern.slf4j.Slf4j;

import io.github.son30kins.workbench.domain.shared.DomainException;
import io.github.son30kins.workbench.domain.shared.NotFoundException;
import io.github.son30kins.workbench.domain.shared.ValidationException;
import io.github.son30kins.workbench.domain.shared.Violation;
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
 * Không bao giờ trả stack trace hay thông điệp nội bộ cho client.
 */
@Slf4j
@RestControllerAdvice
class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	@ExceptionHandler(NotFoundException.class)
	ProblemDetail notFound(NotFoundException ex) {
		return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
	}

	@ExceptionHandler(ValidationException.class)
	ProblemDetail validation(ValidationException ex) {
		return withErrors(ex.getMessage(), ex.violations());
	}

	@ExceptionHandler(InvalidFormValuesException.class)
	ProblemDetail invalidFormValues(InvalidFormValuesException ex) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_CONTENT, ex.getMessage());
		problem.setProperty("fieldErrors", ex.fieldErrors());
		return problem;
	}

	/** Vi phạm quy tắc nghiệp vụ còn lại → 400 với thông điệp tiếng Việt cho người dùng. */
	@ExceptionHandler(DomainException.class)
	ProblemDetail domain(DomainException ex) {
		return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
	}

	@ExceptionHandler(ResponseStatusException.class)
	ProblemDetail status(ResponseStatusException ex) {
		return ProblemDetail.forStatusAndDetail(ex.getStatusCode(), ex.getReason());
	}

	@ExceptionHandler(Exception.class)
	ProblemDetail unexpected(Exception ex) {
		log.error("Lỗi không mong đợi", ex);
		return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Có lỗi xảy ra, thử lại sau");
	}

	/** {@code @Valid} thất bại → danh sách lỗi; path "fields[0].key" đổi thành "fields.0.key". */
	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		List<Violation> violations = ex.getBindingResult()
			.getFieldErrors()
			.stream()
			.map(GlobalExceptionHandler::toViolation)
			.toList();
		var message = violations.isEmpty() ? "Dữ liệu không hợp lệ" : violations.getFirst().message();
		return ResponseEntity.badRequest().body(withErrors(message, violations));
	}

	/** JSON sai cú pháp hoặc giá trị enum lạ. */
	@Override
	protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		return ResponseEntity.badRequest()
			.body(ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Dữ liệu gửi lên không đúng định dạng"));
	}

	private static ProblemDetail withErrors(String message, List<Violation> violations) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, message);
		problem.setProperty("errors", violations);
		return problem;
	}

	private static Violation toViolation(FieldError error) {
		return new Violation(error.getField().replaceAll("\\[(\\d+)]", ".$1"), error.getDefaultMessage());
	}

}
