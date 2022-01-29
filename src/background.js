"use strict";

import { app, protocol, BrowserWindow, ipcMain } from "electron";
const path = require("path");
const Datastore = require("nedb");
var fs = require("fs");
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
const isDevelopment = process.env.NODE_ENV !== "production";

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

let db = {};
let read_counter = 0;

async function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    win.loadURL("app://./index.html");
  }
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }
  createWindow();
});

if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}

const label_map = {
  e: "Entailment",
  c: "Contradiction",
  n: "neutral",
};

ipcMain.on("load_dataset", (event, dataset_name, file_path) => {
  console.log(`Read ${dataset_name} from: ${file_path}`);

  // if (!store.get('datasets').includes(dataset_name)) {
  //   store.set('datasets', )
  // }

  db.dataset = new Datastore({
    filename: `dataset/${dataset_name}.db`,
    autoload: true,
  });
  db.annotation = new Datastore({
    filename: `dataset/${dataset_name}_annotations.db`,
    autoload: true,
  });

  fs.readFile(file_path, "utf-8", (err, data) => {
    if (err) {
      alert("An error ocurred reading the file :" + err.message);
      event.reply("An error ocurred reading the file");
      return;
    }
    var lines = data.toString().replace(/\r\n/g, "\n").split("\n");
    var index = 0;

    lines.forEach((element) => {
      let example = JSON.parse(element);
      let doc = {
        index: index,
        premise: example["context"],
        hypothesis: example["hypothesis"],
        label: label_map[example["label"]],
      };
      db.dataset.insert(doc, function (err, newDoc) {
        console.log(err);
        console.log(newDoc);
      });
      index += 1;
    });
    read_counter = 0;
  });
  event.sender.send("file_loaded");
  console.log("Input sentences loaded and stored.");
});

function load_batch(start, end, event) {
  for (var i = start; i < end; i++) {
    db.dataset.findOne({ index: i }, (err, doc) => {
      if (doc != null) {
        event.sender.send("load_example", doc);
      }
    });
  }
}

ipcMain.on("submit_alignment", (event, annotated_example) => {
  console.log(annotated_example);
});

ipcMain.on("load_batch", (event, dataset_name) => {
  if (!("dataset" in db)) {
    db.dataset = new Datastore({
      filename: `dataset/${dataset_name}.db`,
      autoload: true,
    });
  }

  if (!("annotation" in db)) {
    db.annotation = new Datastore({
      filename: `dataset/${dataset_name}_annotations.db`,
      autoload: true,
    });
  }

  read_counter = 0;
  load_batch(0, 10, event);
  read_counter += 10;
});

ipcMain.on("get_next_batch", (event) => {
  console.log("Loading next batch ...");
  load_batch(read_counter, read_counter + 10, event);
  read_counter += 10;
});

ipcMain.on("get_prev_batch", (event) => {
  console.log("Loading previous batch ...");
  load_batch(read_counter - 20, read_counter - 10, event);
  read_counter -= 10;
});

ipcMain.on("new_span", (event, span_info) => {
  console.log(span_info);
  db.annotations.insert(span_info, function () {});
});
