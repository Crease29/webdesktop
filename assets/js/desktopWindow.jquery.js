// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;
(function ( $, window, document, undefined ) {

    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window and document are passed through as local variable rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // Create the defaults once
    var pluginName = "desktopWindow",
        defaults = {
            icon: 'icon-desktop',
            title: 'New Window',
            resizable: false,
            width: 800,
            height:600,
            posX: 'center',
            posY: 'center',
            contentType: 'HTML',
            contentSource: 'test-content.html',
            actions: {
                minimize: true,
                maximize: true,
                close: true
            }
        };

    // The actual plugin constructor
    function desktopWindow( element, options ) {
        this.element = element;

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.options = $.extend( {}, defaults, options );

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    desktopWindow.prototype = {

        iNormalWidth:  0,
        iNormalHeight: 0,
        iNormalPosX:   0,
        iNormalPosY:   0,

        init: function () {
            // Place initialization logic here
            // You already have access to the DOM element and
            // the options via the instance, e.g. this.element
            // and this.options
            // you can add more functions like the one below and
            // call them like so: this.yourOtherFunction(this.element, this.options).

            this.element     = $( this.element );
            this.taskbarElem = $( '<li>' );

            this.iNormalWidth  = this.options.width + 'px';
            this.iNormalHeight = this.options.height + 'px';
            this.iNormalPosX   = this.options.posX + 'px';
            this.iNormalPosY   = this.options.posY + 'px';

            this.createNew();
            this.setDimensions();
            this.initEvents();
            this.setContent();
            this.appendToDesktop();
            this.addToTaskBar();
        },

        createNew: function() {
            var __this = this;

            this.element.addClass( 'window shadowed' );

            // Create topbar
            this.element.topbar = $( '<div>' ).addClass( 'topbar no-select' );

            var iconElem = document.createElement( 'div' ),
                titleElem = document.createElement( 'div' ),
                actionsElem = document.createElement( 'div' );

            iconElem.className    = 'icon ' + this.options.icon;

            titleElem.className   = 'title';
            titleElem.innerHTML   = this.options.title;

            actionsElem.className = 'actions pull-right';

            if( this.options.actions.minimize )
            {
                var actionsMinimizeElem = document.createElement( 'div' );
                actionsMinimizeElem.className = 'minimize';

                $( actionsMinimizeElem ).click( function() {
                    __this.minimize()
                });

                actionsElem.appendChild( actionsMinimizeElem );
            }

            if( this.options.actions.maximize )
            {
                var actionsMaximizeElem = document.createElement( 'div' );
                actionsMaximizeElem.className = 'maximize';

                $( actionsMaximizeElem ).click( function() { __this.maximize() });

                actionsElem.appendChild( actionsMaximizeElem );
            }

            if( this.options.actions.close )
            {
                var actionsCloseElem = document.createElement( 'div' );
                actionsCloseElem.className = 'close';

                $( actionsCloseElem ).click( function() { __this.close() });

                actionsElem.appendChild( actionsCloseElem );
            }

            this.element.topbar.append( iconElem, titleElem, actionsElem );

            // Create view-content
            this.element.viewContent = $( '<div>' ).addClass( 'view-content' );

            // Create bottombar
            this.element.bottombar = $( '<div>' ).addClass( 'bottombar' );

            this.element.append( this.element.topbar, this.element.viewContent, this.element.bottombar );
        },

        setDimensions: function()
        {
            var oWindows = document.getElementById( 'windows' );

            this.iNormalPosY   = this.options.posY == 'center' ? oWindows.offsetHeight / 2 - parseInt( this.iNormalHeight ) / 2 : this.iNormalPosY;
            this.iNormalPosX   = this.options.posX == 'center' ? oWindows.offsetWidth / 2  - parseInt( this.iNormalWidth )  / 2 : this.iNormalPosX;

            this.element.css(
            {
                width:  this.iNormalWidth,
                height: this.iNormalHeight,
                top:    this.iNormalPosY,
                left:   this.iNormalPosX,
                position: 'absolute'
            } );
        },

        initEvents: function()
        {
            var __this = this;
            this.element.mousedown( function()
            {
                if( this.style.zIndex != webdesktop.windows.zIndexer )
                {
                    this.style.zIndex = ++webdesktop.windows.zIndexer;
                }
            }).draggable(
            {
                handle: this.element.topbar,
                cancel: '.minimize, .maximize, .close',
                start: function()
                {
                    $( this ).removeClass( 'shadowed' );
                },
                stop: function()
                {
                    $( this ).addClass( 'shadowed' );

                    __this.iNormalPosY = __this.element[0].style.top;
                    __this.iNormalPosX = __this.element[0].style.left;
                }
            } );

            this.element.topbar.dblclick( function() { __this.maximize() });
        },

        minimize: function() {
            var __this = this;

            this.element.animate(
            {
                top: '+=30',
                opacity:0
            }, 250, function() { $( this ).addClass( 'minimized' ).hide() } );

            this.taskbarElem.removeClass( 'active' );
        },

        maximize: function() {
            var __this = this;

            this.element.removeAttr( 'style' );

            if( this.element.hasClass( 'maximized') )
            {
                this.element.css(
                {
                    width: __this.iNormalWidth,
                    height: __this.iNormalHeight,
                    top: __this.iNormalPosY,
                    left: __this.iNormalPosX
                } );
            }
            this.element.toggleClass( 'maximized' );
        },

        close: function() {
            this.element.remove();
            this.taskbarElem.remove();
        },

        reopenFromTaskbar: function() {
            this.element.removeClass( 'minimized' ).show().animate(
            {
                top: '-=30',
                opacity:1
            }, 250 );
            this.taskbarElem.addClass( 'active' );
        },

        setContent: function()
        {
            var __this = this;

            if( this.options.contentSource.length > 0 )
            {
                $.ajax({
                    type: "GET",
                    url: this.options.contentSource,
                    dataType: this.options.contentType,
                    success: function( sData )
                    {
                        __this.element.viewContent.html( sData );
                    }
                    // ToDo: Add error handling
                });
            }
        },

        appendToDesktop: function()
        {
            $( '#windows' ).append( this.element );
        },

        addToTaskBar: function()
        {
            var __this = this;

            this.taskbarElem.addClass( 'active no-select' );
            this.taskbarElem.append( '<i class="icon ' + this.options.icon + '"></i> ' + this.options.title );

            this.taskbarElem.click( function()
            {
                __this.element.stop( true, true );
                if( __this.element.hasClass( 'minimized' ) )
                {
                    __this.reopenFromTaskbar();
                }
                else
                {
                    __this.minimize();
                }
            } );

            $( '#tasks' ).append( this.taskbarElem );
        }
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[ pluginName ] = function ( options ) {
        return this.each( function () {
            if ( !$.data( this, "plugin_" + pluginName ) ) {
                $.data( this, "plugin_" + pluginName, new desktopWindow( this, options ) );
            }
        } );
    };

})( jQuery, window, document );