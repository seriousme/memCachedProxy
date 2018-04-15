const DynamoDB = require("../backends/dynamoDB");
const MC = require("../memcachedproxy");
const Memcached = require("memcached");
const Net = require("net");
// server config

const MaxRequestSize = 1024;
const Logger = _ => {};
// DynamoDB
const Table = "userData";
const KeyAttr = "userId";
const ValueAttr = "pwd";
const AWSregion = "eu-west-1";
const Version = 2;

const test = require("tap").test;

const v = Date.now().toString();
let server;
let memcached;

test("starting server", t => {
  server = Net.createServer(
    MC({
      MaxRequestSize,
      Logger,
      Backend: DynamoDB({
        Table,
        KeyAttr,
        ValueAttr,
        AWSregion,
        Logger,
        Version
      })
    })
  );
  server.listen(0, () => {
    memcached = new Memcached("localhost:" + server.address().port);
    t.end();
  });
});

test("get non-existing key", t => {
  memcached.get("a", (err, value) => {
    t.ok(!err, "get should not return an error");
    t.end();
  });
});

test("set", t => {
  memcached.set("a", v, 1, err => {
    t.ok(!err, "set should not return an error");
    t.end();
  });
});

test("get", t => {
  memcached.get("a", (err, value) => {
    t.ok(!err, "get should not return an error");
    t.equals(value, v, "should return the correct value");
    t.end();
  });
});

test("delete", t => {
  memcached.del("a", err => {
    t.ok(!err, "delete should not return a error");
    t.end();
  });
});

test("version", t => {
  memcached.version((err, value) => {
    t.ok(!err, "version should not return a error");
    t.equals(value[0], Version, "should return the correct value");
    t.end();
  });
});

test("teardown", t => {
  memcached.end();
  server.close();
  t.end();
});
