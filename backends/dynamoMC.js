const AWS = require("aws-sdk");
const Config = {
  Table: "myCacheTable",
  KeyAttr: "myKeyAttribute",
  ValueAttr: "myValueAttribute",
  AWSregion: "eu-west-1"
};

class DynamoMC {
  constructor(cfg) {
    this.config = Object.assign(Config, cfg);
    AWS.config.update({
      region: this.config.AWSregion,
      endpoint: `https://dynamodb.${this.config.AWSregion}.amazonaws.com`
    });
    this.DocClient = new AWS.DynamoDB.DocumentClient();
  }
  _request(operation, params) {
    console.log("request", { operation, params });
    return new Promise((resolve, reject) => {
      this.DocClient[operation](params, (err, data) => {
        if (err) {
          reject(
            `Unable to ${operation} item with params: ${JSON.stringify(
              params,
              null,
              2
            )} Error JSON ${JSON.stringify(err, null, 2)}`
          );
        } else {
          console.log("received1", data);
          if (
            operation == "get" &&
            data.Item &&
            data.Item[this.config.ValueAttr]
          ) {
            data = {
              key: params.Key[this.config.KeyAttr],
              value: data.Item[this.config.ValueAttr]
            };
          }
          resolve(data);
        }
      });
    });
  }

  get(p) {
    const Params = {
      TableName: this.config.Table
    };
    Params.Key = {};
    Params.Key[this.config.KeyAttr] = p.key;
    return this._request("get", Params);
  }
  set(p) {
    const Params = {
      TableName: Config.Table
    };
    Params.Item = {};
    Params.Item[this.config.KeyAttr] = p.key;
    Params.Item[this.config.ValueAttr] = p.data;
    return this._request("put", Params);
  }
}

module.exports = config => new DynamoMC(config);
module.exports.DynamoMC = DynamoMC;
