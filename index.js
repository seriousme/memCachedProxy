const DynamoMC = require("./backends/dynamoMC");
const MemCachedServer = require("./memCachedProxy");

const Net = require("net");
// server config
const Port = 11200;

const MaxRequestSize = 1024;
// DynamoDB
const Table = "userData";
const KeyAttr = "userId";
const ValueAttr = "pwd";
const AWSregion = "eu-west-1";

const server = Net.createServer(
  MemCachedServer({
    MaxRequestSize,
    Backend: DynamoMC({
      Table,
      KeyAttr,
      ValueAttr,
      AWSregion
    })
  })
).listen(Port, _ => console.log(`Server started on port ${Port}`));
