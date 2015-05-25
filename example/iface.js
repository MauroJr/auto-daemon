module.exports = function () {
    var n = 0;
    return {
        add: function (m, cb) { cb(n += m) },
        get: function (cb) { cb(n) }
    }
};
