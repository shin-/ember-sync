var PERSISTENCE = true;
/**
 * Module dependencies.
 */
var racer = require('racer'),
    express = require('express'),
    fs = require('fs');

var app = module.exports = express.createServer();
if (PERSISTENCE) {
    var persister = require('./persister.js');
    var store = persister(racer.createStore({
        listen: app,
        namespace: 'contacts',
        mode: 'stm'
    }), 6379, 'localhost', { return_buffers: false });
} else {
    var store = racer.createStore({
        listen: app,
        namespace: 'contacts',
        mode: 'stm'
    });
}

racer.js({ entry: __dirname + '/public/js/requires.js' }, function(js) {
    return fs.writeFileSync(__dirname + '/public/js/racer.js', js);
});

store.flush();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'ice cream soda' }));
  app.use(require('./nicer'));
  app.use(app.router);
  app.use(express['static'](__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', function(req, res) {
    var model = store.createModel();
    res.cookie('sid', req.sessionID);
    model.subscribe("contacts", function(err, contacts) {
        res.bundled(model, {}, 'index', { title : 'Public phone book' });
    });
});

app.listen(3337);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
