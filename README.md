# memCachedProxy

Experiment to create a Memcached server which can work with various backends, e.g:

* an [AWS DynamoDB backend](backends/dynamoDB.js)
* a [memory based backend](https://github.com/seriousme/memCachedProxy/blob/master/backends/lru-cache.js) using the [LRU-cache](https://www.npmjs.com/package/lru-cache) module

## Usage

Clone the repository, run `npm i` and then `npm start`
Change the config in `index.js` to your liking.
