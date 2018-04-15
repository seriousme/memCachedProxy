const LRU = require("../backends/lru-cache");
const MC = require("../memcachedproxy");
const Memcached = require("memcached");
const Net = require("net");
// server config

const MaxRequestSize = 1024;
const Logger = _ => {};
// Lru LruCache
const LruConfig = 50;
const Version = 2;

const test = require("tap").test;

const v = Date.now().toString();
var server;
var memcached;

test("starting server", function(t) {
  server = Net.createServer(
    MC({
      MaxRequestSize,
      Logger,
      Backend: LRU({
        LruConfig,
        Logger,
        Version
      })
    })
  );
  server.listen(0, function() {
    memcached = new Memcached("localhost:" + server.address().port);
    t.end();
  });
});

test("get non-existing key", function(t) {
  memcached.get("a", function(err, value) {
    t.ok(!err, "get should not return an error");
    t.end();
  });
});

test("set", function(t) {
  memcached.set("a", v, 1, function(err) {
    t.ok(!err, "set should not return an error");
    t.end();
  });
});

test("get", function(t) {
  memcached.get("a", function(err, value) {
    t.ok(!err, "get should not return an error");
    t.equals(value, v, "should return the correct value");
    t.end();
  });
});

test("delete", function(t) {
  memcached.del("a", function(err) {
    t.ok(!err, "delete should not return a error");
    t.end();
  });
});

test("version", function(t) {
  memcached.version(function(err, value) {
    t.ok(!err, "version should not return a error");
    t.equals(value[0], Version, "should return the correct value");
    t.end();
  });
});

test("teardown", function(t) {
  memcached.end();
  server.close();
  t.end();
});
