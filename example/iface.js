var n = 0;

module.exports = function () {
    return {
        add: function (m, cb) { cb(n += m) },
        get: function (cb) { cb(n) }
    }
};
