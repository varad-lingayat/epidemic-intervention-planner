const { app, BrowserWindow, dialog, shell } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");

let localServer;
let mainWindow;

// Linux virtual machines frequently expose a partial GPU stack. Prefer Chromium's
// software renderer there so the Three.js miniature can initialize instead of
// producing a blank WebGL canvas. Native acceleration remains unchanged on Windows.
if (process.platform === "linux") {
  app.commandLine.appendSwitch("use-gl", "angle");
  app.commandLine.appendSwitch("use-angle", "swiftshader");
  app.commandLine.appendSwitch("disable-gpu-sandbox");
}

function configurePortableDataDirectory() {
  const portableDirectory = process.env.PORTABLE_EXECUTABLE_DIR;
  if (portableDirectory) {
    app.setPath("userData", path.join(portableDirectory, "EpiGraph-data"));
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1520,
    height: 980,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#07131e",
    title: "EpiGraph — Epidemic Intervention Planner",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  const loadingMarkup = `<!doctype html><html><head><meta charset="utf-8"><title>EpiGraph</title><style>body{margin:0;background:#07131e;color:#e7f7fb;font-family:Segoe UI,Arial,sans-serif;display:grid;place-items:center;height:100vh}.card{width:min(520px,82vw);padding:34px;border:1px solid rgba(125,211,252,.25);border-radius:22px;background:linear-gradient(145deg,#0d2430,#091821);box-shadow:0 28px 80px rgba(0,0,0,.32)}.mark{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:#10b981;color:#052e2b;font-weight:800}.status{margin-top:22px;color:#8ed6e8;font-size:14px}.bar{height:5px;background:#163644;border-radius:99px;margin-top:18px;overflow:hidden}.bar:after{content:'';display:block;width:42%;height:100%;background:#22d3ee;border-radius:99px;animation:load 1.2s ease-in-out infinite alternate}@keyframes load{to{transform:translateX(135%)}}</style></head><body><main class="card"><div class="mark">E</div><h1>EpiGraph</h1><p>Preparing the epidemic intervention workspace.</p><div class="bar"></div><p class="status">Loading local simulation engine…</p></main></body></html>`;
  void window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loadingMarkup)}`);
  return window;
}

async function startDesktopApplication() {
  mainWindow = createWindow();
  const applicationPath = app.getAppPath();
  const staticRoot = app.isPackaged
    ? path.join(process.resourcesPath, "app.asar.unpacked")
    : applicationPath;
  process.env.NODE_ENV = "production";
  process.env.EPIGRAPH_DESKTOP_MODE = "true";
  process.env.EPIGRAPH_DESKTOP_LAUNCHER = "true";
  process.env.EPIGRAPH_STATIC_DIR = path.join(staticRoot, "dist", "public");
  process.env.EPIGRAPH_LOCAL_DATA_DIR = app.getPath("userData");

  const serverEntry = path.join(applicationPath, "dist", "index.js");
  const { startServer } = await import(pathToFileURL(serverEntry).href);
  localServer = await startServer({ preferredPort: 43117 });
  await mainWindow.loadURL(`http://127.0.0.1:${localServer.port}`);
}

configurePortableDataDirectory();

app.whenReady().then(startDesktopApplication).catch(error => {
  console.error("[EpiGraph desktop] Unable to start the local application:", error);
  dialog.showErrorBox(
    "EpiGraph could not start",
    `${error instanceof Error ? error.message : String(error)}\n\nPlease keep the package files together and try again.`
  );
  app.quit();
});

app.on("window-all-closed", () => {
  localServer?.server.close();
  app.quit();
});
