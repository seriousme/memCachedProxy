const BufferList = require("bl");
const Config = {
  MaxRequestSize: 1024,
  Logger: console.log
};

const ParamParser = {
  S: s => s,
  N: n => parseInt(n),
  B: b => !!b,
  A: a => a.split(" ")
};

const Cmds = {
  get: {
    regex: /^(get) ([^\r\n]+)\r\n/,
    params: [["A", "keys"]]
  },
  set: {
    regex: /^(set|add|replace|append|prepend) ([^ \r\n]+) ([0-9]+) ([0-9]+) ([0-9]+)( noreply)?\r\n/,
    params: [
      ["S", "key"],
      ["N", "flags"],
      ["N", "exptime"],
      ["N", "bytes"],
      ["B", "noreply"]
    ]
  },
  delete: {
    regex: /^delete ([^ \r\n]+)(?: [0-9]+)?( noreply)?\r\n/,
    params: [["S", "key"], ["N", "flags"]]
  },
  stats: {
    regex: /^stats(?: ([^\r\n]+))\r\n/,
    params: [["S", "key"], ["N", "flags"]]
  },
  quit: {
    regex: /^quit\r\n/,
    params: [["S", "key"], ["N", "flags"]]
  },
  verbosity: {
    regex: /^verbosity ([0-9]+)( noreply)?\r\n/,
    params: [["S", "key"], ["N", "flags"]]
  },
  flush_all: {
    regex: /^flush_all(?: ([0-9]+))( noreply)?\r\n/,
    params: [["S", "key"], ["N", "flags"]]
  },
  incr: {
    regex: /^(incr|decr) ([^ \r\n]+) ([0-9]+)( noreply)?\r\n/,
    params: [["S", "key"], ["N", "flags"]]
  },
  touch: {
    regex: /^touch ([^ \r\n]+) ([0-9]+)( noreply)?\r\n/,
    params: [["S", "key"], ["N", "flags"]]
  },
  version: {
    regex: /^version\r\n/,
    params: []
  }
};

Cmds.gets = Cmds.get;
Cmds.decr = Cmds.incr;
["add", "replace", "append", "prepend"].forEach(
  item => (Cmds[item] = Cmds.set)
);

class MemCachedServer {
  constructor(cfg) {
    this.config = Object.assign(Config, cfg);
    return s => this._handleConnection(s);
  }

  _executeCmd(req, res) {
    let prom;
    const noreply = req.params.noreply;
    if (req.cmd === "get" || req.cmd === "gets") {
      let Proms = req.params.keys.map(item =>
        this.config.Backend[req.cmd]({ key: item })
      );
      prom = Promise.all(Proms);
    } else {
      prom = this.config.Backend[req.cmd](req.params);
    }

    prom
      .then(result => {
        res.log("DEBUG", result);
        if (!noreply) {
          if (typeof result === "boolean") {
            result = "STORED";
            res.writeLine(result);
          } else if (typeof result === "object") {
            result.forEach(item => res.writeData(item));
            res.writeLine("END");
          } else {
            res.writeLine(result);
          }
        }
      })
      .catch(result => {
        res.log("DEBUG", result);
        if (!noreply) res.writeLine("NOT STORED");
      });
  }

  _cleanUp(req, res) {
    const payload = req.raw.toString("utf8");
    const garbage = payload.match(/^[^\r]*\r\n/);
    if (garbage) {
      req.raw.consume(garbage[0].length);
      res.error("ERROR");
    }
  }

  _parseParams(req, res, Cmd, data) {
    Cmd.params.forEach((item, i) => {
      let type, key;
      [type, key] = item;
      req.params[key] = ParamParser[type](data[i]);
    });

    if (typeof req.params.bytes === "number") {
      this._parseData(req, res);
    } else {
      this._executeCmd(req, res);
      req.reset();
    }
  }

  _parseCmd(req, res) {
    const payload = req.raw.toString("utf8");
    const matched = payload.match(/^(\w+)[^\r]*\r\n/);

    if (matched) {
      const Cmd = matched[1];
      const CmdData = Cmds[Cmd];
      if (CmdData) {
        if (this.config.Backend[Cmd]) {
          const data = payload.match(CmdData.regex);
          if (data) {
            req.cmd = Cmd;
            req.raw.consume(data[0].length);
            this._parseParams(req, res, CmdData, data.slice(2));
          } else {
            res.error("CLIENT ERROR");
            req.raw.consume(matched[0].length);
            req.reset();
          }
        } else {
          res.error(`SERVER ERROR command ${Cmd} not implemented in backend`);
          req.raw.consume(matched[0].length);
          req.reset();
        }
      } else {
        this._cleanUp(req, res);
      }
    } else {
      this._cleanUp(req, res);
    }
  }

  _parseData(req, res) {
    const payload = req.raw.toString("utf8");
    const bytes = req.params.bytes;
    if (payload.length >= bytes + 2) {
      req.params.data = payload.substr(0, bytes);
      req.raw.consume(bytes + 2);
      this._executeCmd(req, res);
      req.reset();
    }
  }

  _handleReq(req, res, data) {
    req.raw.append(data);
    if (req.raw.length > this.config.MaxRequestSize) {
      res.error("Max request size exceeded");
      res.end();
      return;
    }
    if (req.params.bytes == null) {
      this._parseCmd(req, res);
    } else {
      this._parseData(req, res);
    }
  }

  _handleConnection(s) {
    const req = {
      raw: new BufferList(),
      reset: function() {
        this.packet = null;
        this.cmd = null;
        this.params = {};
      }
    };
    req.reset();
    const res = {
      end: s.end,
      log: (l, msg) => this.config.Logger({ level: l, msg }),
      write: s.write,
      writeLine: data => {
        s.write(data + "\r\n");
      },
      writeData: data => {
        if (data && data.value) {
          const len = data.value.length;
          const flags = data.flags || 0;
          res.writeLine(
            `VALUE ${data.key} ${flags} ${len}${data.cas ? " " + data.cas : ""}`
          );
          res.writeLine(data.value);
        }
      },
      error: e => {
        if (e instanceof Error) {
          e = "SERVER_ERROR " + e.message;
        }
        res.writeLine(e);
        res.log("ERROR", e);
        req.reset();
      }
    };
    s.on("data", data => this._handleReq(req, res, data));
    s.on("end", _ => res.log("INFO", "connection closed"));
    res.log(
      "INFO",
      `accepted connection from ${s.remoteAddress}:${s.remotePort}`
    );
  }
}

module.exports = config => new MemCachedServer(config);
module.exports.MemCachedServer = MemCachedServer;
