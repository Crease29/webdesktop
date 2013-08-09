#!/usr/local/bin/node

// Server, see https://gist.github.com/KenanSulayman/6195554
// readDirectory.js, see https://gist.github.com/KenanSulayman/6187951

/*
         __                            ___             
        /\ \                     __  /'___\            
        \ \ \         __     __ /\_\/\ \__/  __  __    
         \ \ \  __  /'__`\ /'_ `\/\ \ \ ,__\/\ \/\ \   
          \ \ \L\ \/\  __//\ \L\ \ \ \ \ \_/\ \ \_\ \  
           \ \____/\ \____\ \____ \ \_\ \_\  \/`____ \ 
            \/___/  \/____/\/___L\ \/_/\/_/   `/___/> \
                             /\____/             /\___/
                             \_/__/              \/__/
 
        Copyright (c) 2013 by Legify UG. All Rights Reserved.
 
        Permission is hereby granted, free of charge, to any person obtaining a copy
        of this software and associated documentation files (the "Software"), to deal
        in the Software without restriction, including without limitation the rights
        to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
        copies of the Software, and to permit persons to whom the Software is
        furnished to do so, subject to the following conditions:
 
        The above copyright notice and this permission notice shall be included in
        all copies or substantial portions of the Software.
 
        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
        IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
        AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
        LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
        OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
        THE SOFTWARE.
*/

var http = require("http"),
        url = require("url"),
        fs = require("fs"),
        path = require("path"),
        mime = require("mime"),
        zlib = require("zlib");

        var port = parseInt(process.argv[2] || 80);
 
        _str = require("stream").Stream;
        require("util").inherits(MemCache, _str);

        function MemCache() {
                _str.call(this);
                this.readable = this.writable = !0;
                this._buffers = [];
                this._dests = []; this._ended = !1
        }
        MemCache.prototype.write = function (a) {
                this._buffers.push(a);
                this._dests.forEach(function (b) { b.write(a) })
        };
        MemCache.prototype.pipe = function (a, b) {
                if (b) return false;
                this._buffers.forEach(function (b) { a.write(b) });
                if (this._ended) return a.end(), a;
                this._dests.push(a);
                return a
        };
        MemCache.prototype.getLength = function () {
                return this._buffers.reduce(function (a, b) { return a + b.length }, 0)
        };
        MemCache.prototype.end = function () {
                this._dests.forEach(function (a) { a.end() });
                this._ended = !0; this._dests = []
        };

/*
    PRIMARY
 
        ctype &
                001 - Array [& ]
                010 - Object-Stat Hashmap
*/
 
var readDictionary = function (start, ctype, callback) {
        var readDir, stash = {};

        ctype instanceof Function && ( callback = ctype, ctype = 1 );

        return (readDir = function(start, callback) {
                fs.lstat(start, function(err, stat) {
                        if (err) return callback(err);

                        var found = { dirs: [], files: [] },
                                total = 0, processed = 0;

                        if (stat.isDirectory()) {
                                fs.readdir(start, function(err, files) {
                                        total = files.length;

                                        if (!total)
                                                return callback(null, found, total);

                                        files.forEach(function (a) {
                                                var abspath = path.join(start, a);

                                                fs.stat(abspath, function(err, stat) {
                                                        if (stat.isDirectory()) {
                                                                ctype & 1 && found.dirs.push(abspath);
                                                                ctype & 2 && (stash[abspath] = stat);
                                                                readDir(abspath, function(err, data) {
                                                                        if ( ctype & 1 ) {
                                                                                found.dirs = found.dirs.concat(data.dirs);
                                                                                found.files = found.files.concat(data.files);
                                                                        }
                                                                        (++processed == total) && callback(null, found, stash);
                                                                });
                                                        } else {
                                                                ctype & 1 && found.files.push(abspath);
                                                                ctype & 2 && (stash[abspath] = stat);
                                                                (++processed == total) && callback(null, found, stash);
                                                        }
                                                });
                                        })
                                });
                        } else {
                                return false;
                        }
                });
        })(start, function (a, b, c) {
                if ( !(ctype ^ 3) )
                        return callback(b, c);

                if ( ctype & 1 )
                        return callback(b);

                if ( ctype & 2 )
                        return callback(c);
        })
};

readDictionary("./static", 2, function (_fm) {
        var _fs = {},
        _fs_cache = {},
        _fs_cache_deflate = {},
        _fs_cache_gzip = {};

        fs._createReadStream = fs.createReadStream;

        fs.createReadStream = function (a, b) {
                return fs._createReadStream.apply(this, arguments);
                void 0 == b && (b = {})

                // whereas a is fd_ref && b is typeof object
                // __ if a, b do not statisfy (String a, Object b) forward to base implementation
                if ( !(typeof a == "string" ) || !(typeof b == "object"))
                        return fs._createReadStream.apply(this, arguments);

                if ( _fs_cache[a] ) return _fs_cache[a];

                _fs_cache[a] = new MemCache();
                fs._createReadStream(a, b).pipe(_fs_cache[a]);
                return _fs_cache[a];            
        }

        var err = path.join(__dirname, "static/error.html");

        http.createServer(function (request, response) {
                var uri = url.parse(request.url).pathname;
                        uri === "/" && (uri += "index.html");

                var fn = path.join(process.cwd(), uri),
                        fn_ = path.join(process.cwd(), "/static", uri),
                        argv = url.parse(request.url).query || {};

                cancel = function () {
                        return response.writeHead(404, {
                                "Content-Type": "text/html"
                        }), fs.createReadStream(err).pipe(response);
                }

                if ( /\.\.\/\.\./.test(uri) || /\.\/\.\./.test(uri) ) 
                        return cancel();
                
                if ( fn_.length < (process.cwd()).length )
                        return cancel();
                
                if ( ~uri.indexOf("/../") )
                        return cancel();

                if ( _fs[fn_] == void 0 ) {
                        _fs[fn_] = fs.existsSync(fn_)
                }
                
                if ( !_fs[fn_] )
                        return cancel(404);

                var s = fs.createReadStream(fn_),
                        etag = _fm["static"+uri].mtime
                        ntag = +etag;

                if ( request.headers["if-none-match"] == ntag )
                        return response.end(response.writeHead(304, {
                                "Date": etag.toString(),
                                "Etag": ntag,
                                "Cache-Control": "max-age=86400, public",
                                "Content-type": "image/jpeg",
                                "Keep-Alive": "timeout=6, max=32",
                                "Connection": "keep-alive"
                        }));

                var aE = request.headers['accept-encoding'] || "",
                        _resHead = {
                        "Content-Type": mime.lookup(fn),
                        "Cache-control": "max-age=604800",
                        "Expire": new Date().toString(),
                        "Etag": ntag
                };

                if (~aE.indexOf("deflate")) {
                        _resHead['Content-Encoding'] = 'deflate';
                        response.writeHead(200, _resHead);

                        if ( _fs_cache_deflate[fn] ) return _fs_cache_deflate[fn].pipe(response);

                        _fs_cache_deflate[fn] = new MemCache();
                        s.pipe(zlib.createDeflate()).pipe(_fs_cache_deflate[fn]);
                        return _fs_cache_deflate[fn].pipe(response);
                }

                if (~aE.indexOf("gzip")) {
                        _resHead['Content-Encoding'] = 'gzip';
                        response.writeHead(200, _resHead);

                        if ( _fs_cache_gzip[fn] ) return _fs_cache_gzip[fn].pipe(response);

                        _fs_cache_gzip[fn] = new MemCache();
                        s.pipe(zlib.createGzip()).pipe(_fs_cache_gzip[fn]);
                        return _fs_cache_gzip[fn].pipe(response);
                }
                
                response.writeHead(200, _resHead);

                return s.pipe(response);

        }).listen(port);

        console.log("Listening on port " + port + ".");
});