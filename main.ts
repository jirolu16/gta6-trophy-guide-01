// Leonida Legend - make.fun entrypoint.
//
// Copies the finished static app (app/) and the screenshot set
// (screenshots/) into the output directory, then writes dossier.json
// using the kit's buildDossier so the judging pipeline receives the
// exact package it expects. Run with: node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// The caps mirror the competition limits for this bounty: the dossier
// text budget, at most 4 screenshots of at most 256 KiB each, and the
// app folder limits of 993 entries and 48 MiB.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648
};

function copyTree(name) {
  const from = join(projectRoot, name);
  const to = join(outputDir, name);
  if (!existsSync(from)) {
    throw new Error("Missing required folder: " + name);
  }
  cpSync(from, to, { recursive: true });
  console.log("copied " + name + "/ -> " + to);
}

function main() {
  mkdirSync(outputDir, { recursive: true });
  copyTree("app");
  copyTree("screenshots");
  const dossierBytes = buildDossier(projectRoot, DOSSIER_CAPS);
  const dossierPath = join(outputDir, "dossier.json");
  writeFileSync(dossierPath, dossierBytes);
  console.log("wrote dossier.json (" + dossierBytes.length + " bytes) -> " + dossierPath);
}

main();
