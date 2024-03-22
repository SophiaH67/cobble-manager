import { WebSocket, WebSocketServer } from "ws";

enum State {
  UNKNOWN = "unknown",
  OFF = "off",
  ON = "on",
}

let cobblestoneState = State.UNKNOWN;
let openWebSockets: WebSocket[] = [];

const wss = new WebSocketServer({ noServer: true });

wss.on("connection", function connection(ws) {
  ws.on("error", console.error);

  ws.on("close", () => {
    openWebSockets.unshift(ws);
    console.log("Connection closed");
  });

  ws.on("message", function message(data) {
    console.log("received: %s", data);
    try {
      const json = JSON.parse(data.toString());
      if (json.type === "set") {
        if (json.state === "on") {
          cobblestoneState = State.ON;
        } else if (json.state === "off") {
          cobblestoneState = State.OFF;
        } else {
          console.warn("Unknown state: " + json.state);
        }
      }
    } catch (e) {
      console.warn("Could not parse message: " + data);
    }
  });

  openWebSockets.push(ws);
});

function turnOffCobblestoneGenerator() {
  console.log("Turning off cobblestone generator");
  openWebSockets.forEach((ws) =>
    ws.send(JSON.stringify({ type: "set", state: "off" }))
  );
  cobblestoneState = State.OFF;
}

function turnOnCobblestoneGenerator() {
  console.log("Turning on cobblestone generator");
  openWebSockets.forEach((ws) =>
    ws.send(JSON.stringify({ type: "set", state: "on" }))
  );
  cobblestoneState = State.ON;
}

// Create a http server
import * as express from "express";
import * as path from "path";

const app = express();

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "./index.html"));
});

app.post("/off", (_req, res) => {
  turnOffCobblestoneGenerator();
  res.send("OK");
});

app.post("/on", (_req, res) => {
  turnOnCobblestoneGenerator();
  res.send("OK");
});

app.get("/state", (_req, res) => {
  res.send(cobblestoneState);
});

const server = app.listen(8080, () => {
  console.log("Web server started on http://0.0.0.0:8080");
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});
