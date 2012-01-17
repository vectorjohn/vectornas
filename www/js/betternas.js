BetterNAS = {
    conf: {
        url: '/v/'
    },

    plugins: {
        Api: {
            //do api request
            get: function( cmd, done )
            {
                jQuery.getJSON( BetterNAS.conf.url + cmd, done );
            }
        }
    },
};

(function( BN, _ ) {
    var priv = {
        plugReadyHandlers: {}
    };

    BN.onPluginReady = function( name, fn ) {
        var prh = priv.plugReadyHandlers;

        if ( _.isArray( name ) && name.length ) {
            fn = _.after( name.length, fn );

            _.each( name, function( n ) {
                BN.onPluginReady( n, fn ); 
            });

        } else if ( !name || BN.plugins[name] ) {
            _.defer( fn );
        } else {
            if ( !prh[ name ] ) {
                prh[ name ] = [];
            }

            prh[ name ].push( fn );
        }

        return this;
    };

    BN.plugin = function( name, obj ) {

        if ( !obj ) {
            return BN.plugins[ name ];
        }

        BN.onPluginReady( obj.require, function() {

            BN.plugins[ name ] = obj;

            if ( _.isFunction( obj.init ) ) {
                obj.init();
            }

            var prh = priv.plugReadyHandlers;
            if ( prh[ name ] ) {
                for ( var i = 0; i < prh[ name ].length; i++ ) {
                    _.defer( prh[ name ][ i ] );
                }

                delete( prh[ name ] );
            }
        });
    };
}( BetterNAS, _ ));
