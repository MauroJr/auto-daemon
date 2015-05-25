# auto-daemon

automatically spawn implicit background services

# example

First, the command line interface wires up actions for each command and loads
the auto-daemon module:

``` js
#!/usr/bin/env node

var autod = require('auto-daemon');
var opts = {
    rpcfile: __dirname + '/iface.js',
    sockfile: '/tmp/whatever.sock',
    methods: [ 'add', 'get', 'close' ]
};

var cmd = process.argv[2];
autod(opts, function (err, r, c) {
    if (err) {
        console.error(err);
    }
    else if (cmd === 'add') {
        var n = Number(process.argv[3]);
        r.add(n, function (res) {
            console.log(res);
            c.destroy();
        });
    }
    else if (cmd === 'get') {
        r.get(function (res) {
            console.log(res);
            c.destroy();
        });
    }
    else if (cmd === 'close') {
        r.close();
    }
});
```

Next, the `iface.js` provides the interfaces and stores the state:

``` js
var n = 0;

module.exports = function (server, stream) {
    return {
        add: function (m, cb) { cb(n += m) },
        get: function (cb) { cb(n) },
        close: function () { server.close(); stream.destroy() }
    }
};
```

Now the first time the command is run, a daemon is implicitly launched in the
background. When the server is shutdown with `close`, the state is reset as a
new server is implicitly created on the next action:


```
$ node cmd.js add 2
2
$ node cmd.js add 3
5
$ node cmd.js add 4
9
$ node cmd.js close
$ node cmd.js add 5
5
```

# methods

``` js
var autod = require('auto-daemon')
var createServer = require('auto-daemon/server')
```

## autod(opts, cb)

Connect to a daemon instance, spawning the daemon first if it isn't already
running.

`cb(err, rpc, connection)` fires with the rpc interface to call methods on and
the unix socket connection instance.

* `opts.rpcfile` - file that exports an rpc interface (required)
* `opts.methods` - an array of methods to expose (required)
* `opts.sockfile` - file to use as the unix socket (required)
* `opts.autoclose` - if `true`, close the server when the refcount drops to 0

The daemon refcount goes up by 1 for each connection and drops by 1 when a
client disconnects. If the object returned by the rpc interface is an event
emitter, it can emit `'ref`' events to increment the refcount and `'unref'`
events to decrement the refcount.

## var server = createServer(createIface, opts)

Use this method if you'd rather create the server yourself.
This is useful if you want the server to listen in the foreground.

Pass in the `createIface` function, which should be the same value as requiring
an rpc file.

`opts.autoclose` behaves the same as with `autod()`.

# rpc interface

The rpc file should export a function that returns an object.

The function will be called with the server and connection stream and should
return the rpc methods for that connection.

# license

MIT