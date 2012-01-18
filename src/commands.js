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

        path = toRealPath( path );
        if ( !path ) {
            //TODO: 404
            return handleError( {error: 'File not found'}, done );
        }

        if ( path === true ) {
            path = _.reduce( conf.shares, function( memo, info, name ) {
                memo[name] = info.path;
                return memo;
            }, {});

            statFiles( path, false );

            return;
        }

		fs.readdir( path, function( err, files )
		{

			if ( err ) {
				return handleError( err, done );
			}

			if ( !files.length ) {
				done( {files: infoList} );
				return;
			}

            statFiles( files, path );
        });

        //files is an array of file names, abs is the path they are in
        //if abs is false, files is the conf.shares list
        function statFiles( files, abs ) {

            var listShares = !abs;  //no abs (root) dir means list shares

			var infoList = [];
            var numFiles = _.isArray( files ) ? 
                files.length : _.keys( files ).length ;

			var fileMapped = _.after( numFiles, function() {
				done( {
					files: infoList
				} );
			});
			_.each( files, function(f, name) {
                var stats;

                try {
                    stats = fs.statSync( listShares ? 
                        f : abs + '/' + f );
                } catch ( ex ) {
                    //I guess we ignore this one.
                    console.log( 'Error statting file: ',
                        listShares ? f : abs + '/' + f );
                        
                    fileMapped();
                    return;
                }

				var finfo = {};

				if ( !stats ) {
					finfo = { name: listShares ? name : f };
					infoList.push( finfo );
					fileMapped();
					return;
				}

				finfo = {
                    name: listShares ? name : f,
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
		}
	},

	get: function( path, done ) {

        var abs = toRealPath( path );
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

/**
 * given a path like /foo/bar/baz, finds out what virtual top level
 * folder /foo is, then takes that path and adds /bar/baz.
 * returns false if the top level is not found.
 * returns true for the root
 */
function toRealPath( vpath ) {
    var pjoin = require( 'path' ).join;

    //remove leading slash so it can match root names
    if ( vpath.charAt(0) === '/' ) {
        vpath = vpath.substr(1);
    }

    //vpath was "/", which just means list all the shares.
    if ( !vpath.length ) {
        return true;
    }

    vpath = vpath.split( '/' );
    var vroot = vpath.shift();

    var root = _.find( conf.shares, function( info, name ) {
        return vroot === name;
    });


    if ( root ) {
        return pjoin.apply( this, [ root.path ].concat( vpath ) );
    }

    return false;
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
