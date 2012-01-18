(function( BN, $ ) {

var Player = {
    require: ['File'],

    init: function() {
        console.log( 'player init' );

        var current = null;
        var opts = { shuffle: false };

        var aud = $('<audio controls autoplay />')
            .bind( 'ended', function() {
                nextSong();
            })
            .appendTo( 'body' );

        function nextSong() {

            if ( opts.shuffle ) {
                return randSong();
            }

            current.removeClass( 'current' );

            if ( current.next().length ) {
                current = current.next();
            } else {
                current = playlist.children().first();
            }

            current.addClass( 'current' );

            aud.attr( 'src', current.val() );
        }

        function randSong() {
            var songs = playlist.children().length;

            playlist.children().eq( Math.floor( Math.random() * songs ) ).click();

            /*
            current.removeClass( 'current' );
            current = playlist.children().eq( Math.floor( Math.random() * songs ) );
            current.addClass( 'current' );
            current.click();

            aud.attr( 'src', current.val() );
            */
        }

        var playlist = $('<select multiple />')
            .addClass( 'playlist' )
            .appendTo( 'body' );

        playlist.wrap( '<div class="playlist-wrap"/>' );
        var controls = $('<div class="controls" />')
            .insertAfter( playlist );

        $('<a href="#clear">Clear </a>')
            .click( function( ev ) {
                ev.preventDefault();
                playlist.empty();
                aud.attr( 'src', '' )[0].pause(); //not sure how to stop
            })
            .appendTo( controls );

        $('<a href="#next">Next </a>')
            .click( function( ev ) {
                ev.preventDefault();
                nextSong();
            })
            .appendTo( controls );

        $('<a href="#random">Random </a>')
            .click( function( ev ) {
                ev.preventDefault();
                randSong();
            })
            .appendTo( controls );

        $('<br/>').appendTo( controls );

        $('<label></label>')
            .append( $('<input type="checkbox" />')
                .change( function() {
                    opts.shuffle = !!$(this).attr( 'checked' );
                })
            )
            .append( 'Shuffle' )
            .appendTo( controls );

        BN.plugin('File').views
            .tree( {
                root: '/music',
                filter: new RegExp( '^(audio/|image|dir$)' ),
                rootLabel: 'Music'
            })
            .bind( 'fileselect', function( ev, f ) {
                aud.attr( 'src', f.src );
                console.log( 'foo', ev );
                var sibs = $(ev.target).closest( 'ul' )
                    .children()
                    .children();

                sibs.each( function() {
                    var sibf = $(this).data('File');
                    if ( sibf.type.substr( 0, 5 ) !== 'audio' ) {
                        return;
                    }

                    var opt = $('<option />')
                        .click( function() {
                            if ( current ){
                                current.removeClass( 'current' );
                            }
                            current = $(this).addClass( 'current' );
                            aud.attr( 'src', $(this).val() );
                        })
                        .val( sibf.src )
                        .text( sibf.name )
                        .appendTo( playlist );

                    if ( sibf.name === f.name ) {
                        if ( current ){ 
                            current.removeClass( 'current' );
                        }
                        current = opt;
                        current.addClass( 'current' );
                    }
                });

            })
            .appendTo( 'body' );
    }
};

BetterNAS.plugin( 'Player', Player );

}( BetterNAS, jQuery ));
