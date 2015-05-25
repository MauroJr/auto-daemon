var autod = require('../');

var opts = {
    rpcfile: __dirname + '/iface.js',
    sockfile: '/tmp/whatever.sock',
    methods: [ 'add', 'get' ]
};

var cmd = process.argv[2];
autod(opts, function (err, r) {
    if (err) return console.error(err);
    if (cmd === 'add') {
        var n = Number(process.argv[3]);
        r.add(n, function (res) {
            console.log(res);
            r.disconnect();
        });
    }
    else if (cmd === 'get') {
        r.get(function (res) {
            console.log(res);
            r.disconnect();
        });
    }
});
