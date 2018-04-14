const AWS = require("aws-sdk");
const Config = {
  Table: "myCacheTable",
  KeyAttr: "myKeyAttribute",
  ValueAttr: "myValueAttribute",
  AWSregion: "eu-west-1",
  Logger: console.log,
  Version: 1
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

  _log(l, msg) {
    this.config.Logger({ level: l, msg });
  }

  _request(operation, params) {
    this._log("DEBUG", `request ${JSON.stringify({ operation, params })}`);
    return new Promise((resolve, reject) => {
      this.DocClient[operation](params, (err, data) => {
        if (err) {
          this._log(
            "DEBUG",
            `Unable to ${operation} item with params: ${JSON.stringify(
              params,
              null,
              2
            )} Error JSON ${JSON.stringify(err, null, 2)}`
          );
          reject();
        } else {
          this._log("DEBUG", `received ${JSON.stringify(data)}`);
          if (operation == "get") {
            if (data.Item && data.Item[this.config.ValueAttr]) {
              data = {
                key: params.Key[this.config.KeyAttr],
                value: data.Item[this.config.ValueAttr]
              };
            }
            resolve(data);
          } else {
            resolve(true);
          }
        }
      });
    });
  }
  // the memcached commands
  get(p) {
    // translate single request into multiple promises, 1 for each key to get
    const Proms = p.keys.map(item => {
      const Params = {
        TableName: this.config.Table
      };
      Params.Key = {};
      Params.Key[this.config.KeyAttr] = item;
      return this._request("get", Params);
    });
    return Promise.all(Proms);
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

  version() {
    return new Promise((resolve, reject) => {
      resolve(this.config.Version);
    });
  }
}

module.exports = config => new DynamoMC(config);
module.exports.DynamoMC = DynamoMC;
