// STOKKU — launcher Pterodactyl (egg startup: `node run.js`)
// Menjalankan server Next.js standalone yang ada di ./server.js
process.env.NODE_ENV = "production";

// Pterodactyl mengisi HOSTNAME dengan nama container, jadi paksa bind ke semua interface.
process.env.HOSTNAME = "0.0.0.0";
process.env.PORT = String(process.env.SERVER_PORT || process.env.PORT || 6002);

console.log(
  `[run.js] STOKKU start -> http://${process.env.HOSTNAME}:${process.env.PORT}`,
);

require("./server.js");
