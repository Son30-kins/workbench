import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/server/auth";

// Khởi tạo Better Auth khi có request đầu tiên, không phải lúc build
const handler = (request: Request) => getAuth().handler(request);

export const { GET, POST } = toNextJsHandler(handler);
