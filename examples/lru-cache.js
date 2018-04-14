const LRU = require("../backends/lru-cache");
const MemCachedServer = require("../memCachedProxy");

const Net = require("net");
// server config
const Port = 11200;

const MaxRequestSize = 1024;
// LRU
const LruConfig = 50;

const server = Net.createServer(
  MemCachedServer({
    MaxRequestSize,
    Backend: LRU({ LruConfig })
  })
).listen(Port, _ => console.log(`Server started on port ${Port}`));
