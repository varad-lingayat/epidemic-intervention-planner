import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeRoot = path.join(projectRoot, "desktop-runtime");

const runtimeManifest = {
  name: "epigraph-desktop-runtime",
  version: "1.0.0",
  description: "Academic epidemic intervention simulator desktop runtime.",
  author: "Varad Lingayat",
  license: "MIT",
  private: true,
  main: "desktop/main.cjs",
  dependencies: {
    "@trpc/server": "^11.0.0-rc.510",
    axios: "^1.7.9",
    cookie: "^1.0.2",
    dotenv: "^16.4.7",
    "drizzle-orm": "^0.44.2",
    express: "^4.21.2",
    jose: "^5.9.6",
    mysql2: "^3.12.0",
    nanoid: "^5.0.9",
    superjson: "^2.2.2",
    zod: "^3.24.1"
  }
};

await rm(runtimeRoot, { recursive: true, force: true });
await mkdir(runtimeRoot, { recursive: true });
await Promise.all([
  cp(path.join(projectRoot, "dist"), path.join(runtimeRoot, "dist"), { recursive: true }),
  cp(path.join(projectRoot, "desktop"), path.join(runtimeRoot, "desktop"), { recursive: true }),
]);
await writeFile(
  path.join(runtimeRoot, "package.json"),
  `${JSON.stringify(runtimeManifest, null, 2)}\n`,
  "utf8",
);
