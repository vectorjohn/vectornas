var http = require('http');
var sys = require('sys');
var _ = require('underscore');

var commands = require( './commands' );

var conf = require( '../config' );

function RequestHandler(req){
	this.req = req;
	this.status = 200;
    _.each(this.routes, function(route) {
        if ( route.regex ) {
            route.regex = new RegExp(route.regex);
        } else {
            route.regex = new RegExp('(.*)');
        }
    });
}

RequestHandler.prototype = {
	getResult: function(done){
        var req = this.req,
            resp;
        _.any(this.routes, function( r ) {
            var match = r.regex.exec( req.url );
            if ( match ) {
                resp = r.fun.apply(this, [done].concat(match.slice(1)));
                return true;
            }
            return false;
        }, this);

        return resp;
	},
	getHeaders: function(){
		return {'Content-Type': 'application/json'};
    },

    stringify: function( o ) {
        return JSON.stringify(o);
    },

    routes: [
        {regex: '^/files/(.*)', fun: function(done, path) {
			commands.files( path, done );
        }},

        {regex: '^/help/?$', fun: function( done ) {
            done({
                commands: [
                    ['player/<id>', 'Get player info'],
                    ['help', 'Help']
                ]
            });
        }},
        {fun: function(done) {
            done('Invalid command');
        }}
    ]
};

http.createServer(function (req, res) {
    console.log(req.url);
	var rh = new RequestHandler(req);
	res.writeHead(rh.status, rh.getHeaders());

    rh.getResult(function(resp) {
        res.end(rh.stringify(resp));
    });
	
}).listen(conf.port, "127.0.0.1");

console.log('Server running at http://127.0.0.1:' + conf.port);
