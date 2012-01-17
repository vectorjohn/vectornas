var child_process = require( 'child_process' ),
	_ = require('underscore'),
	exec = child_process.exec,
	pathmod = require( 'path' ),
	fs = require( 'fs' ),
	mimeMagic = require( 'mime-magic' ),
	mime = require( 'mime' ),
	conf = require( '../config' );

var commands = {
	files: function( path, done ) {
		var abs = conf.shares.default.path + '/' + path;

		fs.readdir( abs, function( err, files )
		{
			var infoList = [];

			if ( err ) {
				return handleError( err, done );
			}

			if ( !files.length ) {
				done( {files: infoList} );
				return;
			}

			var fileMapped = _.after( files.length, function() {
				done( {
					files: infoList
				} );
			});
			_.each( files, function(f) {
				var stats = fs.statSync( abs + '/' + f );
				var finfo = {};

				if ( !stats ) {
					finfo = { name: f };
					infoList.push( finfo );
					fileMapped();
					return;
				}

				finfo = {
					name: f,
					type: 'application/octet-stream',
					size: stats.size,
					mtime: stats.mtime,
					atime: stats.atime,
					ctime: stats.ctime
				};

				infoList.push( finfo );

				if ( stats.isDirectory() ) {
					finfo.type = 'dir';
				} else if ( stats.isFile() ) {
					//TODO: get specific type
					mimeLookup( abs + '/' + f, function( mt )
					{
						finfo.type = mt;
						fileMapped();
					});
					return;
				}

				fileMapped();
			});
		});
	},

	get: function( path, done ) {

		var abs = conf.shares.default.path + '/' + path;
		var self = this;

		fs.stat( abs, function( err, stats ) {

			if ( err ) {
				return handleError( err, done );
			}

			if ( !stats.isFile() ) {
				return handleError( {error: 'Not a file'}, done );
			}

			mimeLookup( abs, function( mt ) {
			
				self.res.writeHead(200, {
					'Content-Type': mt,
					'Content-Length': stats.size
				});

				var file = fs.createReadStream( abs, {
				});

				file.resume();

				file.on( 'data', function( d ) {
					self.res.write( d );
				});

				file.on( 'end', function() {
					//file.end();
					done();
				});
			});
		});
	}
};


function handleError( err, done )
{
	//TODO: RequestHandler should allow the response from done() to set headers,
	//or have a way of mapping certain errors to headers.
	console.log( 'err', err );
	done( {error: err} );
}

function mimeLookup( path, done ) {
	var tp = mime.lookup( path, 'unknown' );
	if ( tp !== 'unknown' ) {
		_.defer( function(){
			done( tp );
		} );
		return;
	}

	console.log( 'resorting to slow lookup: ', path );
	mimeMagic.fileWrapper( path, function( err, mt ) {
		if ( err ) {
			done( tp );
		} else {
			done( mt );
		}
	});
}

mime.define( {
	'application/x-gzip': ['gz', 'tgz'],
	'text/sql':	['sql']
});

module.exports = commands;
