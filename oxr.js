var timeout = 3000; //Timeout in ms

var host = {
    protocol: 'https',
    baseURL: 'openexchangerates.org',
    apiPath: '/api'
};

var oxr_options = {
    app_id: '',
    base: 'USD'
};

var oxr_data = {}; // Actual data from the last call
var oxr_hist_data = {}; // Last historical data received.
var oxr_currencies = {}; // List of the currencies: {"TZS": "Tanzanian Shilling", ...}

var remoteCall = function (remote, callParams, successCb, failCb) {
    var remoteServer = require(remote.protocol || 'https');

    var responseData = "";
    var rqParams = callParams.action;

    if (callParams.hasOwnProperty('param')) {
        if (typeof callParams.param != 'object') {
            rqParams += '/' + callParams.param;
        } else {
            rqParams += '?';
            var itr = 0;
            for (var prop in callParams.param) {
                if (callParams.param.hasOwnProperty(prop)) {
                    rqParams += (itr ? '&' : '') + prop + '=' + callParams.param[prop];
                    itr++;
                }
            }
        }
    }

    var options = {
        host: remote.baseURL,
        port: remote.port || 443,
        path: remote.apiPath + rqParams,
        method: callParams.method || 'GET',
        agent: false,
        headers: {}
    };

    if (callParams.method == 'POST') {
        options.headers['Content-Type'] = callParams.contentType ? callParams.contentType : 'application/json';
        options.headers['Content-Length'] = callParams.postData.length;
    }

    var rsRequest = remoteServer.request(options, function (rsResponse) {
        rsResponse.on('data', function (chunk) {
            responseData += chunk;
        });
        rsResponse.on('end', function () {
            try {
                responseData = JSON.parse(responseData);
            } catch (e) {
                return failCb('JSON PARSER: Cannot parse response from server');
            }

            if (rsResponse.statusCode == 200) {
                return successCb(responseData);
            }

            return failCb(responseData);
        });
    });

    rsRequest.on('socket', function (socket) {
        if (callParams.hasOwnProperty('timeout') && callParams.timeout) {
            socket.setTimeout(callParams.timeout);
        } else {
            socket.setTimeout(timeout);
        }

        socket.on('timeout', function() {
            rsRequest.abort();
        });
    });

    rsRequest.on('error', function (e) {
        return failCb(e.message);
    });

    if (callParams.method == 'POST') {
        rsRequest.write(callParams.postData);
    }

    rsRequest.end();
};

exports.latest = function () {
    return oxr_data;
}();

exports.historical = function () {
    return oxr_hist_data;
}();

exports.currencies = function () {
    return oxr_currencies;
}();

exports.loadLatest = function(callback) {
    var callParams = {
        action: '/latest.json',
        param: {
            app_id: oxr_options.app_id,
            base: oxr_options.base
        }
    };

    remoteCall(host, callParams, function (responseData) {
        if ( responseData && responseData.base && responseData.rates ) {
            oxr_data.base = responseData.base;
            oxr_data.rates = responseData.rates;
            oxr_data.timestamp = responseData.timestamp * 1000; // (Convert from UNIX time to ms)
            oxr_data.error = '';
        }

        if (typeof callback === 'function') {
            callback();
        }
    }, function (response) {
        if (typeof response === 'string') {
            oxr_data.error = response;
        } else {
            oxr_data.error = response.message + ': ' + response.description;
        }

        if (typeof callback === 'function') {
            callback();
        }
    });
};

// Format of the date param must be 'YYYY-MM-DD'
exports.loadHistorical = function(date, callback) {
    var callParams = {
        action: '/historical/' + date + '.json',
        param: {
            app_id: oxr_options.app_id,
            base: oxr_options.base
        }
    };

    remoteCall(host, callParams, function (responseData) {
        if ( responseData && responseData.base && responseData.rates ) {
            oxr_hist_data.base = responseData.base;
            oxr_hist_data.rates = responseData.rates;
            oxr_hist_data.timestamp = responseData.timestamp * 1000; // (Convert from UNIX time to ms)
            oxr_hist_data.error = '';
        }

        if (typeof callback === 'function') {
            callback();
        }
    }, function (response) {
        if (typeof response === 'string') {
            oxr_hist_data.error = response;
        } else {
            oxr_hist_data.error = response.message + ': ' + response.description;
        }

        if (typeof callback === 'function') {
            callback();
        }
    });
};

exports.loadCurrenciesList = function(callback) {
    var callParams = {
        action: '/currencies.json'
    };

    remoteCall(host, callParams, function (responseData) {
        if ( responseData ) {
            for(var key in responseData) {
                oxr_currencies[key] = responseData[key];
            }
        }

        if (typeof callback === 'function') {
            callback(null);
        }
    }, function (response) {
        var error;

        if (typeof response === 'string') {
            error = response;
        } else {
            error = response.message + ': ' + response.description;
        }

        if (typeof callback === 'function') {
            callback(error);
        }
    });
};

exports.setOptions = function(options) {
    for(var key in options) {
        if (options.hasOwnProperty(key)) {
            oxr_options[key] = options[key];
        }
    }
};
