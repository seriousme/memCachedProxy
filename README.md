# memCachedProxy

Experiment to create a Memcached server which can work with various backends, e.g:

* an [AWS DynamoDB backend](backends/dynamoDB.js)
* a [memory based backend using the LRU-cache module from NPMJS](https://github.com/seriousme/memCachedProxy/blob/master/backends/lru-cache.js)

## Usage

Clone the repository, run `npm i` and then `npm start`
Change the config in `index.js` to your liking.
