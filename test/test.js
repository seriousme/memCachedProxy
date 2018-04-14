const DynamoMC = require("../backends/dynamoMC");

const Table = "userData";
const KeyAttr = "userId";
const ValueAttr = "pwd";
const AWSregion = "eu-west-1";

const t = DynamoMC({
  Table,
  KeyAttr,
  ValueAttr,
  AWSregion
});
// t
//   .set({ key: "x", value: "y" })
//   .then(r => console.log(r))
//   .catch(e => console.log(e));
t
  .get({ key: "x" })
  .then(r => console.log(r))
  .catch(e => console.log(e));
