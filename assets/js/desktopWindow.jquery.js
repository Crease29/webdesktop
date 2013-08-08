// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;
(function( $, window, document, undefined )
{

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
            icon:            'icon-desktop',
            title:           'New Window',
            resizable:       true,
            width:           800,
            height:          600,
            minWidth:        300,
            minHeight:       200,
            maxWidth:        null,
            maxHeight:       null,
            posX:            'center',
            posY:            'center',
            contentType:     'HTML',
            contentSource:   'test-content.html',
            contentSelector: 'div.content:first-child',
            actions:         {
                reload:   true,
                minimize: true,
                maximize: true,
                close:    true,
                resize:   true
            }
        };

    // The actual plugin constructor
    function desktopWindow( element, options )
    {
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

        init: function()
        {
            // Place initialization logic here
            // You already have access to the DOM element and
            // the options via the instance, e.g. this.element
            // and this.options
            // you can add more functions like the one below and
            // call them like so: this.yourOtherFunction(this.element, this.options).

            this.element = $( this.element );
            this.taskbarElem = $( '<li>' );

            this.iNormalWidth = this.options.width + 'px';
            this.iNormalHeight = this.options.height + 'px';
            this.iNormalPosX = this.options.posX + 'px';
            this.iNormalPosY = this.options.posY + 'px';

            this.createNew();
            this.setDimensions();
            this.initEvents();
            this.setContent();
            this.appendToDesktop();
            this.addToTaskBar();
        },

        createNew: function()
        {
            this.element.addClass( 'window shadowed' );

            // Create topbar
            this.element.topbar = $( '<div>' ).addClass( 'topbar no-select' );

            var __this = this,
                iconElem = document.createElement( 'div' ),
                titleElem = document.createElement( 'div' ),
                actionsElem = document.createElement( 'div' );

            iconElem.className = 'icon ' + this.options.icon;

            titleElem.className = 'title';
            titleElem.innerHTML = this.options.title;

            actionsElem.className = 'actions pull-right';

            if( this.options.actions.reload )
            {
                var actionsReloadElem = document.createElement( 'div' );
                actionsReloadElem.className = 'reload';

                $( actionsReloadElem ).click(
                    function()
                    {
                        __this.setContent()
                    } );

                actionsElem.appendChild( actionsReloadElem );
            }

            if( this.options.actions.minimize )
            {
                var actionsMinimizeElem = document.createElement( 'div' );
                actionsMinimizeElem.className = 'minimize';

                $( actionsMinimizeElem ).click(
                    function()
                    {
                        __this.minimize()
                    } );

                actionsElem.appendChild( actionsMinimizeElem );
            }

            if( this.options.actions.maximize )
            {
                var actionsMaximizeElem = document.createElement( 'div' );
                actionsMaximizeElem.className = 'maximize';

                $( actionsMaximizeElem ).click(
                    function()
                    {
                        __this.maximize()
                    } );

                actionsElem.appendChild( actionsMaximizeElem );
            }

            if( this.options.actions.close )
            {
                var actionsCloseElem = document.createElement( 'div' );
                actionsCloseElem.className = 'close';

                $( actionsCloseElem ).click(
                    function()
                    {
                        __this.close()
                    } );

                actionsElem.appendChild( actionsCloseElem );
            }

            this.element.topbar.append( iconElem, titleElem, actionsElem );

            // Create view-content
            this.element.viewContent = $( '<div>' ).addClass( 'view-content' );

            // Create Loading Screen
            this.element.viewContent.loadingScreen = $( '<div>' ).addClass( 'loading-screen' );
            this.element.viewContent.append( this.element.viewContent.loadingScreen );

            // Create bottombar
            this.element.bottombar = $( '<div>' ).addClass( 'bottombar' );

            this.element.append( this.element.topbar, this.element.viewContent, this.element.bottombar );
        },

        setDimensions: function()
        {
            var oWindows = document.getElementById( 'windows' );

            this.iNormalPosY = this.options.posY == 'center' ? oWindows.offsetHeight / 2 - parseInt( this.iNormalHeight ) / 2 : this.iNormalPosY;
            this.iNormalPosX = this.options.posX == 'center' ? oWindows.offsetWidth / 2 - parseInt( this.iNormalWidth ) / 2 : this.iNormalPosX;

            this.element.css(
                {
                    width:    this.iNormalWidth,
                    height:   this.iNormalHeight,
                    top:      this.iNormalPosY,
                    left:     this.iNormalPosX,
                    position: 'absolute'
                } );
        },

        initEvents: function()
        {
            var __this = this;
            this.element.mousedown(
                function()
                {
                    __this.focus();
                } ).draggable(
                {
                    handle: this.element.topbar,
                    cancel: '.reload, .minimize, .maximize, .close',
                    start:  function()
                    {
                        $( this ).removeClass( 'shadowed' );
                    },
                    stop:   function()
                    {
                        $( this ).addClass( 'shadowed' );

                        __this.iNormalPosY = __this.element[0].style.top;
                        __this.iNormalPosX = __this.element[0].style.left;
                    }
                } );

            if( this.options.actions.resize )
            {
                var __this = this;
                this.element.resizable(
                    {
                        minWidth:  this.options.minWidth,
                        minHeight: this.options.minHeight,
                        maxWidth:  this.options.maxWidth,
                        maxHeight: this.options.maxHeight,
                        stop:      function( e, o )
                        {
                            __this.iNormalWidth = o.size.width + "px";
                            __this.iNormalHeight = o.size.height + "px";
                        }
                    } );
            }

            this.element.topbar.dblclick(
                function( e )
                {
                    if( !/reload|minimize|maximize|close/.test( e.target.className ) )
                    {
                        __this.maximize()
                    }
                } );
        },

        minimize: function()
        {
            this.element.animate(
                {
                    top:     '+=30',
                    opacity: 0
                }, 250,function()
                {
                    $( this ).addClass( 'minimized' ).hide()
                } ).removeClass( 'active' );

            this.taskbarElem.removeClass( 'active' );
        },

        maximize: function()
        {
            var __this = this,
                isMaximized = this.element.hasClass( 'maximized' );

            this.element.removeAttr( 'style' );

            if( isMaximized )
            {
                this.element.css(
                    {
                        width:  this.iNormalWidth,
                        height: this.iNormalHeight,
                        top:    this.iNormalPosY,
                        left:   this.iNormalPosX
                    } );
            }

            this.element.draggable( isMaximized ? 'enable' : 'disable' );

            if( this.options.resizable )
            {
                this.element.resizable( isMaximized ? 'enable' : 'disable' ).find( '.ui-resizable-handle' ).toggle();
            }

            this.element.toggleClass( 'maximized' ).css( 'zIndex', ++webdesktop.windows.zIndexer );
        },

        close: function()
        {
            this.element.remove();
            this.taskbarElem.remove();
        },

        reopenFromTaskbar: function()
        {
            $( '#windows' ).find( '.window.active' ).removeClass( 'active' );

            this.element.removeClass( 'minimized' ).show().animate(
                {
                    top:     '-=30',
                    opacity: 1
                }, 250 ).css( 'zIndex', ++webdesktop.windows.zIndexer ).addClass( 'active' );
            this.taskbarElem.addClass( 'active' );
        },

        setTitle: function( sTitle )
        {
            this.element.topbar.find( '.title' ).text( sTitle );
            this.taskbarElem.find( '.title' ).text( sTitle );

            return this;
        },

        setContent: function( sUrl, sContentType, sRequestType, sContentSelector )
        {
            var __this = this;

            this.options.contentSource = sUrl || this.options.contentSource;
            this.options.contentType = sContentType || this.options.contentType;
            this.options.contentSelector = sContentSelector || this.options.contentSelector;

            if( this.options.contentSource.length > 0 )
            {
                this.showLoadingScreen();

                $.ajax( {
                            type: sRequestType || "GET",
                            url:      this.options.contentSource,
                            dataType: this.options.contentType,
                            success:  function( sData )
                            {
                                var oCont = $( '<div>' + sData + '</div>' );

                                __this.element.viewContent.html( $( __this.options.contentSelector, oCont ) ).prepend( __this.element.viewContent.loadingScreen );
                                __this.initContentElementEvents();
                                __this.evalScripts( $( 'script', oCont ) );
                                __this.hideLoadingScreen();
                            }
                            // ToDo: Add error handling
                        } );
            }
        },

        initContentElementEvents: function()
        {
            var __this = this;

            this.element.viewContent.find( 'a:not([target="_blank"],[href^="javascript:"])' ).click(
                function( e )
                {
                    e.preventDefault();

                    var sContentSelector = this.getAttribute( 'data-content-selector' );

                    __this.setContent( this.href, 'HTML', 'GET', sContentSelector );
                } );
        },

        evalScripts: function( aScriptElems )
        {
            if( aScriptElems.length > 0 )
            {
                var oWin = this; // Will be used in evaled scripts
                $.each( aScriptElems,
                        function()
                        {
                            try
                            {
                                eval( this.innerHTML );
                            }
                            catch( e )
                            {
                                if( typeof console != 'undefined' && typeof console.error != 'undefined' )
                                {
                                    console.error( e );
                                }
                            }
                            $( this ).remove();
                        } );
            }
        },

        focus: function()
        {
            if( this.element[0].style.zIndex != webdesktop.windows.zIndexer )
            {
                this.element[0].style.zIndex = ++webdesktop.windows.zIndexer;

                $( '#windows' ).find( '.window.active' ).removeClass( 'active' );
                this.element.addClass( 'active' );

                $( '#tasks' ).find( 'li.active' ).removeClass( 'active' );
                this.taskbarElem.addClass( 'active' );
            }
        },

        showLoadingScreen:   function()
        {
            this.element.viewContent.loadingScreen.show()
        },
        hideLoadingScreen:   function()
        {
            this.element.viewContent.loadingScreen.hide()
        },
        toggleLoadingScreen: function()
        {
            this.element.viewContent.loadingScreen.toggle()
        },

        appendToDesktop: function()
        {
            $( '#windows' ).append( this.element );
        },

        addToTaskBar: function()
        {
            var __this = this;

            this.taskbarElem.addClass( 'active no-select' );
            this.taskbarElem.append( '<i class="icon ' + this.options.icon + '"></i> <span class="title">' + this.options.title + '</span>' );

            this.taskbarElem.click(
                function()
                {
                    __this.element.stop( true, true );
                    if( __this.element.hasClass( 'minimized' ) )
                    {
                        __this.reopenFromTaskbar();
                    }
                    else
                    {
                        if( __this.element[0].style.zIndex != webdesktop.windows.zIndexer )
                        {
                            __this.focus();
                        }
                        else
                        {
                            __this.minimize();
                        }
                    }
                } );

            $( '#tasks' ).append( this.taskbarElem );
        }
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[ pluginName ] = function( options )
    {
        return this.each(
            function()
            {
                if( !$.data( this, pluginName ) )
                {
                    $.data( this, pluginName, new desktopWindow( this, options ) );
                }
            } );
    };

})( jQuery, window, document );