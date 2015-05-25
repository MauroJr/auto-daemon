var path = require('path');
var net = require('net');
var RPC = require('rpc-stream');
var fs = require('fs');

var minimist = require('minimist');
var argv = minimist(process.argv.slice(2), {
    boolean: [ 'autoclose' ],
    default: { autoclose: false }
});

var createIface = require(path.resolve(argv._[0]));
var connected = 0;

if (argv.pidfile) {
    fs.writeFile(argv.pidfile, String(process.pid));
}

var server = net.createServer(function (stream) {
    // todo: stream wrap the iface
    var iface = createIface(server, stream);
    if (typeof iface.on === 'function') {
        iface.on('ref', function () { connected ++ });
        iface.on('unref', function () { connected -- });
    }
    
    var client = RPC(iface);
    stream.pipe(client).pipe(stream);
    
    connected ++;
    var ended = false;
    stream.once('end', onend);
    stream.once('error', onend);
    stream.once('close', onend);
    
    function onend () {
        if (ended) return;
        ended = true;
        connected --;
        
        if (!argv.autoclose) return;
        if (connected === 0) {
            setTimeout(function () {
                if (connected === 0) server.close();
            }, 1000);
        }
    }
});
server.listen(argv.sockfile, function () {
    if (argv.parentpid) process.kill(argv.parentpid, 'SIGUSR2');
});
