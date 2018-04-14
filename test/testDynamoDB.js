const DynamoMC = require("../backends/dynamoMC");
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

const test = require("tap").test;

test("test can use with memcache driver!", function(t) {
  const server = Net.createServer(
    MC({
      MaxRequestSize,
      Logger,
      Backend: DynamoMC({
        Table,
        KeyAttr,
        ValueAttr,
        AWSregion
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

        memcached.end();
        server.close();

        t.end();
      });
    });
  });
});