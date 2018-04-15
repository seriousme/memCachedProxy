const LRU = require("../backends/lru-cache");
const MC = require("../memcachedproxy");
const Memcached = require("memcached");
const Net = require("net");
// server config

const MaxRequestSize = 1024;
const Logger = _ => {};
// Lru LruCache
const LruConfig = 50;

const test = require("tap").test;

test("test can use LRU-cache with memcache driver!", function(t) {
  const server = Net.createServer(
    MC({
      MaxRequestSize,
      Logger,
      Backend: LRU({
        LruConfig,
        Logger
      })
    })
  );
  server.listen(0, function() {
    var memcached = new Memcached("localhost:" + server.address().port);

    var v = Date.now().toString();
    memcached.set("a", v, 1, function(err, data) {
      t.ok(!err, "set should not have error");

      memcached.get("a", function(err, value) {
        t.ok(!err, "get should not have error");
        t.equals(value, v, "should return the correct value");

        memcached.del("b", function(err, value) {
          t.ok(!err, "delete should not have error");
          memcached.end();
          server.close();

          t.end();
        });
      });
    });
  });
});
