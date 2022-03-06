import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel, data) => {
    let validChannels = ["load_dataset", "load_batch", "submit_alignment"];
    if (validChannels.includes(channel)) {
      console.log("send " + channel);
      ipcRenderer.send(channel, data);
    }
  },
  on: (channel, func) => {
    let validChannels = ["load_example", "file_loaded", "current_submitted"];
    if (validChannels.includes(channel)) {
      console.log("receive " + channel);
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
});
