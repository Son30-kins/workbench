package io.github.son30kins.workbench.domain.task;

/** Bộ đếm cho panel bên trái: tất cả việc đang mở, hôm nay, quá hạn, 7 ngày tới. */
public record TaskCounts(long all, long today, long overdue, long week) {

}
