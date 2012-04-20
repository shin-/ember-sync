var redis = require('redis');

module.exports = function() {
    var client = redis.createClient.apply(redis, arguments);
    this.create = function(u, pw, cb) {
        client.hsetnx('pb:users', u, pw, function(err, res) {
            if (err) return cb(err);
            if (res == 1) {
                cb(null, { u : u, pw : pw });
            } else {
                cb('Username already taken', { u : u });
            }
        });
    };
    
    this.check = function(u, pw, cb) {
        client.hget('pb:users', u, function(err, res) {
            if (err) return cb(err);
            if (pw == res) {
                cb(null, { u : u, pw : pw });
            } else if (res !== null) {
                cb('Invalid password', { u : u });
            } else {
                cb('Username does not exist', { u : u, pw : pw });
            }
        });
    }
    return this;
}
