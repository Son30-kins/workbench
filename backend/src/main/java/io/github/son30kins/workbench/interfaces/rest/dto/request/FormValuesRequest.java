package io.github.son30kins.workbench.interfaces.rest.dto.request;

import java.util.Map;

import jakarta.validation.constraints.NotNull;

/** Giá trị điền vào form mẫu: mã trường → chuỗi hoặc true/false. */
public record FormValuesRequest(@NotNull Map<String, Object> values) {

}
