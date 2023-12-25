
module.exports = class utils {
    static error = (status, msg) => {
        var error = Error(msg)
        error.status = status
        return error
    }
}