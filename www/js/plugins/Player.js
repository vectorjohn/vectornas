(function( BN, $ ) {

var Player = {
    require: ['File'],

    init: function() {
        console.log( 'player init' );

        var aud = $('<audio controls autoplay />')
            .appendTo( 'body' );

        BN.plugin('File').views
            .tree( {
                root: '/Media/Music',
                filter: new RegExp( '^(audio/|image|dir$)' ),
                rootLabel: 'Music'
            })
            .bind( 'fileselect', function( ev, f ) {
                aud.attr( 'src', f.src );
            })
            .appendTo( 'body' );
    }
};

BetterNAS.plugin( 'Player', Player );

}( BetterNAS, jQuery ));
