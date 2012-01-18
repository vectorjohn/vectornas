(function( BN, $ ) {

var File = {
    init: function(){
        console.log( 'File init' );
    },

    list: function( path, done ) {
        BetterNAS.plugins.Api.get( 'files/' + path, done );
    }
};

File.views = {
    tree: function( opts ) {

        var root = opts.root || '/';
        var filter = opts.filter || function(){ return true; };
        var rootLabel = opts.rootLabel || 'Files';

        var plugs = BetterNAS.plugins;

        var el = $('<div/>');

        var list = $('<ul/>')
            .append( '<li><a href="#files' + root + '">' + rootLabel + '</a></li>' )
            .appendTo( el );

        if ( _.isRegExp( filter ) ) {
            filter = (function( re ) {

                return function( f ) {
                    return re.test( f.type );
                };

            }( filter ));
        } else if ( !_.isFunction( filter ) ) {

            filter = (function( types ) {

                return function( f ) {
                    var match = false;
                    _.each( types, function( tp ) {
                        if ( tp === f.type ) {
                            match = true;
                            return false;
                        }
                    });

                    return match;
                };

            }( filter ));
        }

        list.delegate( 'a', 'click', function( ev )
        {
            ev.preventDefault();
            ev.stopPropagation();

            var node = $(ev.currentTarget);
            var path = node.attr( 'href' ).substr( '#files/'.length );

            //path = encodeURI( path.substr( 0, path.length - 1 ) );
            //path = encodeURI( path );

            if ( node.hasClass( 'type-file' ) ) {
                //HANDLE THE FILE CLICK
                //window.location = '/v/get/' + path;
                node.trigger( 'fileselect', node.data( 'File' ) );
                return;
            }

            if ( node.children( 'ul' ).length ) {
                node.children( 'ul' ).remove();
                return;
            }

            File.list( path, function( res )
            {
                var ul = $('<ul/>');

                res.files.sort(function( a, b ) {
                    if ( a.name === b.name )
                    {
                        return 0;
                    }

                    return a.name < b.name ? -1 : 1;
                });

                _( res.files ).chain()
                    .filter( filter )
                    .each( function( f )
                    {
                        f.src = '/v/get/' + path + '/' + f.name;
                        $('<li/>')
                            .append( $('<a/>')
                                .data( 'File', f )
                                .addClass( f.type === 'dir' ? 'type-dir' : 'type-file' )
                                .attr( 'href', '#files/' + path + '/' + f.name )
                                .text( f.name ) )
                            .appendTo( ul );
                    });

                node.append( ul );
            });
        });


        return el;
    }
};

BetterNAS.plugin( 'File', File );

}( BetterNAS, jQuery ));
