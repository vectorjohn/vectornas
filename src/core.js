var http = require('http');
var sys = require('sys');
var _ = require('underscore');

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
        {regex: '^/player/(.*)', fun: function(done, id) {
            done(game.getPlayers()[id]);
        }},
        {regex: '^/status/?$', fun: function(done) {
            done(game.getStatus());
        }},
        {regex: '^/star/(.*)/?$', fun: function(done, sid) {
            game.getStar(sid, function( res ) {
                done(res);
            });
        }},
        {regex: '^/hood/(.*)$', fun: function( done, pid ) {
            game.getNeighborhood(pid, function( res ) {
                done(res);
            });
        }},
        {regex: '^/move/(.*?)/(.*?)/?$', fun: function( done, player, star ) {
            game.move(player, star, function(result) {
                done(result);
            });
        }},
        {regex: '^/event/(.*)/?$', fun: function( done, star ) {
            game.testEvent(star, function ( result ) {
                done(result);
            });
        }},
        {regex: '^/save/?$', fun: function( done ) {
            game.saveState( function( result ) {
                done(result);
            });
        }},
        {regex: '^/load/?$', fun: function( done ) {
            game.loadState( function( result ) {
                done(result);
            });
        }},
        {regex: '^/lp/(.*)/?$', fun: function( done, pid ) {
            game.playerPoll(pid, done);
        }},
        {regex: '^/travel/(.*?)/(.*?)/?$', fun: function( done, shipId, dest ) {
            //dest may be a star ID or vector from ship in light years
            game.travelShip( shipId, dest, done );
        }},


        {regex: '^/help/?$', fun: function( done ) {
            done({
                commands: [
                    ['player/<id>', 'Get player info'],
                    ['status', 'Server status'],
                    ['star/<star>', 'Detailed star information'],
                    ['hood/<id>', 'Get player neighborhood'],
                    ['move/<player>/<star>', 'Move player to star'],
                    ['save', 'save game state'],
                    ['load', 'load game state'],
                    ['event/<star>', 'Create an event at star'],
                    ['longpoll/<player>', 'listen for events sent to player'],
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
	//res.writeHead(200, {'Content-Type': 'text/plain'});
	//res.write(sys.inspect(req.url));
	//res.end('Hello World\n');
    console.log(req.url);
	var rh = new RequestHandler(req);
	res.writeHead(rh.status, rh.getHeaders());

    rh.getResult(function(resp) {
        res.end(rh.stringify(resp));
    });
	
}).listen(9001, "127.0.0.1");

game.mainLoop();

console.log('Server running at http://127.0.0.1:9001/');
