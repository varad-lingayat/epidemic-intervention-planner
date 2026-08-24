import { afterEach, describe, expect, it } from "vitest";
import { readFile } from "fs/promises";
import path from "path";
import type { Server } from "http";

let activeServer: Server | null = null;

afterEach(async () => {
  if (activeServer) {
    await new Promise<void>(resolve => activeServer?.close(() => resolve()));
    activeServer = null;
  }
});

describe("desktop runtime", () => {
  it("starts a loopback-only production service for the packaged client", async () => {
    process.env.NODE_ENV = "production";
    process.env.EPIGRAPH_DESKTOP_LAUNCHER = "true";
    process.env.EPIGRAPH_DESKTOP_MODE = "true";
    process.env.EPIGRAPH_STATIC_DIR = path.join(process.cwd(), "dist", "public");

    const { startServer } = await import("./_core/index");
    const runtime = await startServer({ preferredPort: 44880 });
    activeServer = runtime.server;

    const response = await fetch(`http://127.0.0.1:${runtime.port}/`);

    expect(response.ok).toBe(true);
    expect(await response.text()).toContain('<div id="root"></div>');
  });

  it("configures fast portable extraction and exposes an immediate local loading window", async () => {
    const packageJson = JSON.parse(await readFile(path.join(process.cwd(), "package.json"), "utf8"));
    const desktopMain = await readFile(path.join(process.cwd(), "desktop", "main.cjs"), "utf8");

    expect(packageJson.build.compression).toBe("store");
    expect(packageJson.build.portable.useZip).toBe(true);
    expect(packageJson.scripts["desktop:deb"]).toContain("--linux deb --x64");
    expect(packageJson.build.linux.target[0].target).toBe("deb");
    expect(packageJson.build.linux.target[0].arch).toEqual(["x64"]);
    expect(packageJson.build.publish).toBeNull();
    expect(desktopMain).toContain("Loading local simulation engine");
    expect(desktopMain).toContain('process.platform === "linux"');
    expect(desktopMain).toContain('appendSwitch("use-angle", "swiftshader")');
    expect(desktopMain).toContain("mainWindow = createWindow()");
  });
});
