// GitHub Pages (静的公開) 用の最終調整。`npm run build:pages` の後段で動く。
// 1. TanStack Start の SPA ビルド成果物 (dist/client など) を dist/pages に集約する。
//    Nitro プラグイン (Vercel プリセット) が有効なこのリポジトリでは、
//    成果物は .vercel/output/static に出る。dist/client は Nitro が無い場合。
// 2. SPA シェル (_shell.html) を index.html にも置く (ルートに直接アクセスできるようにするため)。
// 3. 未知のサブパスでも Desk が描画されるよう 404.html にも同じシェルを置く。
// 4. Jekyll の処理を無効化する .nojekyll を置く (_ で始まるファイルを無視させないため)。
// 認証・DB まわりのスキャフォールドには触らない。Pages では /api/auth などは
// 使われず、台帳の動作は静的データ + localStorage だけで完結する。
import {
  cpSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const clientDirCandidates = [
  "dist/client",
  ".vercel/output/static",
  ".output/public",
];
const clientDir = clientDirCandidates.find(
  (dir) =>
    existsSync(join(dir, "_shell.html")) || existsSync(join(dir, "index.html")),
);
if (!clientDir) {
  console.error(
    "[prepare-pages] 静的ビルド成果物が見つかりません。先に vite build を実行してください。",
  );
  process.exit(1);
}
const pagesDir = "dist/pages";
rmSync(pagesDir, { recursive: true, force: true });
mkdirSync(pagesDir, { recursive: true });
for (const entry of readdirSync(clientDir)) {
  cpSync(join(clientDir, entry), join(pagesDir, entry), { recursive: true });
}
const shell = join(pagesDir, "_shell.html");
const index = join(pagesDir, "index.html");
if (!existsSync(index) && existsSync(shell)) {
  copyFileSync(shell, index);
}
if (existsSync(index)) {
  copyFileSync(index, join(pagesDir, "404.html"));
}
writeFileSync(join(pagesDir, ".nojekyll"), "");
console.log("[prepare-pages] " + clientDir + " -> " + pagesDir);
