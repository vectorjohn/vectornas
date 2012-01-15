var http = require('http');
var util = require('util');
var _ = require('underscore');

var commands = require( './commands' );

var conf = require( '../config' );

function RequestHandler( req, res ){
	this.req = req;
	this.res = res;
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
			url = decodeURI( req.url ),
            resp;
        _.any(this.routes, function( r ) {
            var match = r.regex.exec( url );
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
			commands.files.call( this, path, done );
        }},

        {regex: '^/get/(.*)', fun: function(done, path) {
			commands.get.call( this, path, done );

			//this function handles output
			return true;
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
	var rh = new RequestHandler(req, res);

    var status = rh.getResult(function(resp) {
		//this callback can be passed no arguments (or falsy) to
		//indicate that it already wrote the output.
		if ( resp )
		{
			res.end(rh.stringify(resp));
		}
		else
		{
			res.end();
		}
    });

	//getResult can return true to indicate that it will deal
	//with writing headers.
	if ( !status ) {
		res.writeHead(rh.status, rh.getHeaders());
	}
	
}).listen(conf.port, "127.0.0.1");

console.log('Server running at http://127.0.0.1:' + conf.port);
