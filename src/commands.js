var child_process = require( 'child_process' ),
	exec = child_process.exec,
	pathmod = require( 'path' ),
	fs = require( 'fs' ),
	conf = require( '../config' );

var commands = {
	files: function( path, done )
	{
		var abs = conf.shares.default.path + '/' + path;

		fs.readdir( abs, function( err, files )
		{
			if ( err )
			{
				console.log( 'err', err );
				done( {error: err} );
				return;
			}

			done( {
				files: files
			} );
		});

	}
};


module.exports = commands;
