var net = require('net');
var defined = require('defined');
var RPC = require('rpc-stream');
var fs = require('fs');
var path = require('path');
var once = require('once');
var spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;

module.exports = function (opts, cb) {
    if (!opts) opts = {};
    if (!opts.sockfile) throw new Error('opts.sockfile not provided');
    if (!opts.rpcfile) throw new Error('opts.rpcfile not provided');
    if (!opts.methods) throw new Error('opts.methods list not provided');
    
    fs.stat(opts.sockfile, onstat);
    var emitter = new EventEmitter;
    return emitter;
    
    function onstat (err) {
        if (err) connectAndDaemonize(cb);
        else connect(opts.sockfile, opts.methods, function (err, r) {
            if (err) connectAndDaemonize(cb)
            else cb(null, r)
        })
    }
    function connectAndDaemonize (cb) {
        fs.unlink(opts.sockfile, function () {
            daemon(opts, function (err) {
                if (err) cb(err)
                else connect(opts.sockfile, methods, cb)
            });
        });
    }
};

function daemon (opts, cb) {
    cb = once(cb || function () {});
    var args = [
        path.join(__dirname, 'server.js'),
        opts.rpcfile,
        '--sockfile', opts.sockfile,
        '--autoclose', Boolean(opts.autoclose),
        '--parentpid', process.pid
    ];
    var ps = spawn(process.execPath, args, {
        stdio: 'ignore',
        detached: true
    });
    
    ps.once('exit', function (code) {
        cb(new Error('exited with code: ' + code));
    });
    process.once('SIGUSR2', function () {
        ps.unref();
        cb()
    });
}

function connect (sockfile, methods, cb_) {
    var cb = once(function (err, r) {
        process.nextTick(function () {
            process.removeListener('uncaughtException', onuncaught);
        });
        cb_(err, r);
    });
    var c = net.connect(sockfile);
    var client = RPC();
    var r = client.wrap(methods);
    r.disconnect = function () { c.destroy() };
    c.once('connect', function () {
        cb(null, r);
    });
    c.once('error', cb);
    c.pipe(client).pipe(c);
    
    function onuncaught (err) {
        // needed because some core bug with catching errors in unix sockets
        if (err && err.code === 'ECONNREFUSED') {}
        else {
            console.error(err.stack || err);
            process.exit(1);
        }
    }
}
