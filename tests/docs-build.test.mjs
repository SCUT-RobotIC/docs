import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..");
const siteRoot = repoRoot;
const outputRoot = path.join(repoRoot, "docs");
const legacyName = ["git", "book"].join("");

test("builds the Docusaurus knowledge base under the docs URL", () => {
  const result =
    process.platform === "win32"
      ? spawnSync(process.env.ComSpec ?? "cmd.exe", [
          "/d",
          "/s",
          "/c",
          "npm run build",
        ], {
          cwd: siteRoot,
          encoding: "utf8",
        })
      : spawnSync("npm", ["run", "build"], {
          cwd: siteRoot,
          encoding: "utf8",
        });

  assert.equal(
    result.status,
    0,
    `Docusaurus build failed (${result.error?.message ?? "no spawn error"}):\n${result.stdout}\n${result.stderr}`,
  );

  const indexHtml = readFileSync(path.join(outputRoot, "index.html"), "utf8");
  assert.match(indexHtml, /RobotIC 知识库/);
  assert.match(indexHtml, /\/docs\/assets\//);
  assert.match(indexHtml, /\/docs\/img\/robot-logo-dark\.png/);
  assert.match(indexHtml, /\/docs\/img\/robot-logo-light\.png/);
  assert.ok(existsSync(path.join(repoRoot, "static", "img", "favicon.png")));
  assert.ok(
    existsSync(path.join(outputRoot, "writing-guide", "index.html")),
    "expected the writing guide at docs/writing-guide/",
  );
  assert.equal(
    existsSync(path.join(outputRoot, "markdown-page", "index.html")),
    false,
    "Docusaurus template routes must not be published",
  );
  assert.equal(
    existsSync(path.join(repoRoot, legacyName)),
    false,
    "the obsolete nested project directory must be removed",
  );

  const filesWithoutLegacyName = [
    "README.md",
    "package.json",
    "docusaurus.config.ts",
    "sidebars.ts",
    "content/welcome.mdx",
    "content/writing-guide.md",
    "docs/index.html",
    "docs/writing-guide/index.html",
  ];
  for (const relativePath of filesWithoutLegacyName) {
    const content = readFileSync(path.join(repoRoot, relativePath), "utf8");
    assert.doesNotMatch(
      content,
      new RegExp(legacyName, "i"),
      `${relativePath} still contains the obsolete project name`,
    );
  }
});
