function Nas( cmd, done )
{
	$.getJSON( Nas.conf.url + cmd, done );
}

Nas.conf = {
	url: '/v/'
};

$(function()
{
	var list = $('<ul/>')
		.append( '<li><a href="#files/">Files</a></li>' )
		.children( 'a' )
			.end()
		.appendTo( '#page-content' );

	list.delegate( 'a', 'click', function( ev )
	{
		console.log( ev );

		ev.preventDefault();
		ev.stopPropagation();

		var node = $(ev.currentTarget);
		var path = node.attr( 'href' ).substr( '#files/'.length );

		//path = encodeURI( path.substr( 0, path.length - 1 ) );
		path = encodeURI( path );

		if ( node.hasClass( 'type-file' ) ) {
			window.location = '/v/get/' + path;
			return;
		}

		if ( node.children( 'ul' ).length ) {
			node.children( 'ul' ).remove();
			return;
		}

		Nas( 'files/' + path, function( res )
		{
			var ul = $('<ul/>');

			res.files.sort(function( a, b ) {
				if ( a.name === b.name )
				{
					return 0;
				}

				return a.name < b.name ? -1 : 1;
			});

			_.each( res.files, function( f )
			{
				$('<li/>')
					.append( $('<a/>')
							.addClass( f.type === 'dir' ? 'type-dir' : 'type-file' )
							.attr( 'href', '#files/' + path + '/' + f.name )
							.text( f.name ) )
					.appendTo( ul );
			});

			node.append( ul );
		});
	});
});
