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

		var node = $(ev.target);
		var path = node.attr( 'href' ).substr( 1 );

		if ( node.children( 'ul' ).length )
		{
			node.children( 'ul' ).remove();
			return;
		}

		Nas( path, function( res )
		{
			var ul = $('<ul/>');

			res.files.sort();
			_.each( res.files, function( f )
			{
				$('<li/>')
					.append( $('<a/>')
							.attr( 'href', '#' + path + f + '/' )
							.text( f ) )
					.appendTo( ul );
			});

			node.append( ul );
		});
	});
});
