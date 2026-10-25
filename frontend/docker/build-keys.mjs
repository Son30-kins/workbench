// Khoá do Next.js tự sinh lúc build (Draft Mode, mã hoá Server Action) sẽ giống nhau ở mọi bản cài
// vì image được phát hành công khai. Script này:
//   scrub <thư mục .next>     — lúc build: thay khoá thật bằng giá trị rỗng để image không chứa khoá nào
//   instance <thư mục .next>  — lúc container khởi động: ghi khoá riêng của bản cài (dẫn xuất từ AUTH_SECRET)
//                               và in ra khoá mã hoá Server Action để entrypoint đặt NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
import { createHmac } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const [mode, dir] = process.argv.slice(2);
if (!["scrub", "instance"].includes(mode) || !dir) {
  console.error("Cách dùng: node build-keys.mjs <scrub|instance> <thư mục .next>");
  process.exit(2);
}

const files = {
  prerender: path.join(dir, "prerender-manifest.json"),
  previewProps: path.join(dir, "server", "preview-props.json"),
  actionsJson: path.join(dir, "server", "server-reference-manifest.json"),
  actionsJs: path.join(dir, "server", "server-reference-manifest.js"),
};

const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const writeJson = (f, v) => fs.writeFileSync(f, JSON.stringify(v));

function setPreview(preview) {
  if (fs.existsSync(files.prerender)) {
    const m = readJson(files.prerender);
    m.preview = preview;
    writeJson(files.prerender, m);
  }
  if (fs.existsSync(files.previewProps)) writeJson(files.previewProps, preview);
}

if (mode === "scrub") {
  setPreview({
    previewModeId: "0".repeat(32),
    previewModeSigningKey: "0".repeat(64),
    previewModeEncryptionKey: "0".repeat(64),
  });
  if (fs.existsSync(files.actionsJson)) {
    const placeholder = Buffer.alloc(32).toString("base64");
    const real = readJson(files.actionsJson).encryptionKey;
    if (real) {
      for (const f of [files.actionsJson, files.actionsJs]) {
        if (fs.existsSync(f)) fs.writeFileSync(f, fs.readFileSync(f, "utf8").split(real).join(placeholder));
      }
    }
  }
  console.log("✓ Đã xoá khoá build khỏi bản build");
} else {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    console.error("✋ Thiếu AUTH_SECRET (ít nhất 32 ký tự) trong .env — tạo bằng: openssl rand -base64 32");
    process.exit(1);
  }
  const derive = (label, bytes) =>
    createHmac("sha256", secret).update(`workbench:${label}`).digest().subarray(0, bytes);
  setPreview({
    previewModeId: derive("preview-id", 16).toString("hex"),
    previewModeSigningKey: derive("preview-signing", 32).toString("hex"),
    previewModeEncryptionKey: derive("preview-encryption", 32).toString("hex"),
  });
  process.stdout.write(derive("server-actions", 32).toString("base64"));
}
