// App-Objekt
webdesktop = {
    windows: {
        zIndexer: 1
    }
};

function recalcWindowPlayground()
{
    var oWindows = document.getElementById( 'windows' );
    oWindows.style.height = window.innerHeight - document.getElementById( 'taskbar' ).offsetHeight + "px";
    oWindows.style.width = window.innerWidth  + "px";

    return oWindows;
}
recalcWindowPlayground();

window.onresize = function(event) { recalcWindowPlayground() }

function updateClock() {
    var oElem = document.getElementById( 'sysclock' );
    if( typeof oElem != 'undefined' )
    {
        var oDate = new Date(),
            oElemTime = document.createElement( 'span' ),
            oElemDate = document.createElement( 'span' );

        oElemTime.className = 'time';
        oElemTime.textContent = oDate.toTimeString().replace(/.*(\d{2}:\d{2})(:\d{2}).*/, "$1");

        oElemDate.className = 'date';
        oElemDate.textContent = ( oDate.getDate() < 10 ? '0' : null ) + oDate.getDate() + '.' + ( oDate.getMonth() < 10 ? '0' : null ) + oDate.getMonth() + '.' + oDate.getFullYear();

        oElem.innerHTML = '';
        oElem.appendChild( oElemTime );
        oElem.appendChild( oElemDate );
    }
}
updateClock();
window.setInterval( updateClock, 999 );