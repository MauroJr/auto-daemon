var net = require('net');
var RPC = require('rpc-stream');

module.exports = function (createIface, opts) {
    if (!opts) opts = {};
    var connected = 0;
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
            
            if (!opts.autoclose) return;
            if (connected === 0) {
                setTimeout(function () {
                    if (connected === 0) server.close();
                }, 1000);
            }
        }
    });
    return server;
};
