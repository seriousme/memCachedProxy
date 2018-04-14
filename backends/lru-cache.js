const LruCache = require("lru-cache");
const Config = {
  LruConfig: 50,
  Logger: console.log,
  Version: 1
};

class LRU {
  constructor(cfg) {
    this.config = Object.assign(Config, cfg);
    this.cache = LruCache(this.config.LruConfig);
  }

  // the memcached commands
  get(p) {
    // translate single request into multiple promises, 1 for each key to get
    const Proms = p.keys.map(key => {
      return new Promise((resolve, reject) => {
        const value = this.cache.get(key);
        resolve({ key, value });
      });
    });
    return Promise.all(Proms);
  }

  set(p) {
    return new Promise((resolve, reject) => {
      this.cache.set(p.key, p.data);
      resolve(true);
    });
  }

  delete(p) {
    return new Promise((resolve, reject) => {
      const has = this.cache.has(p.key);
      this.cache.del(p.key);
      resolve(has);
    });
  }

  version() {
    return new Promise((resolve, reject) => {
      resolve(this.config.Version);
    });
  }
}

module.exports = config => new LRU(config);
module.exports.LRU = LRU;
