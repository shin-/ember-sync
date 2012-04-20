var redis = require('redis');

module.exports = function(store, port, host, opts) {
    var red = redis.createClient(port, host, opts);
    var listkey = 'pb:contacts';
    var pListKey = 'pb:privates:';
    
    store.route('get', 'privates.*', function(user, done, next) {
        console.log(arguments);
        red.lrange(pListKey + user, 0, -1, function(err, result) {
            if (err) return done(err);
            for (var i = result.length - 1; i >= 0; i--) {
                result[i] = JSON.parse(result[i]);
            }
            return done(null, result);
        });
    });

    store.route('set', 'privates.*.*', function(user, index, obj, version, done, next) {
        console.log(arguments);
        red.lset(pListKey + user, index, JSON.stringify(obj), done);
    });

    store.route('push', 'privates.*', function(user, obj, version, done, next) {
        console.log(arguments);
        red.lpush(pListKey + user, JSON.stringify(obj), done);
    });

    store.route('remove', 'privates.*', 
        function(user, index, count, version, done, next) {
            console.log(arguments);
            red.lindex(pListKey + user, index, function(err, result) {
                if (err) return done(err);
                red.lrem(pListKey + user, 1, result, done);
            });
        });

    store.route('get', 'contacts', function(path, done, next) {
        red.lrange(listkey, 0, -1, function(err, result) {
            if (err) return done(err);
            for (var i = result.length - 1; i >= 0; i--) {
                result[i] = JSON.parse(result[i]);
            }
            return done(null, result);
        });
    });

    store.route('set', 'contacts.*', function(index, obj, version, done, next) {
        red.lset(listkey, index, JSON.stringify(obj), done);
    });

    store.route('push', 'contacts', function(path, obj, version, done, next) {
        red.lpush(listkey, JSON.stringify(obj), done);
    });

    store.route('remove', 'contacts', function(path, index, count, version, done, next) {
        red.lindex(listkey, index, function(err, result) {
            if (err) return done(err);
            red.lrem(listkey, 1, result, done);
        });
    });

    return store;
};
