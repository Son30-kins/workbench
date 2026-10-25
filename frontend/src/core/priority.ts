export const PRIORITIES = ["URGENT", "HIGH", "MEDIUM", "LOW"] as const;
export type PriorityValue = (typeof PRIORITIES)[number];

// Tên hiển thị theo ngôn ngữ: t.priority / t.status (src/i18n/messages)

/** Thứ tự sắp xếp: số nhỏ = ưu tiên cao */
export const PRIORITY_RANK: Record<PriorityValue, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export const STATUSES = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"] as const;
export type StatusValue = (typeof STATUSES)[number];

export const BOARD_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const satisfies readonly StatusValue[];
