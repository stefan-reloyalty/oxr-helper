var oxr = require('../oxr.js');

console.log('Enter your APP_ID here (the one you got from openexchangerate.org): ');

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function (input) {
    input = input.replace(/\r?\n|\r/g, ""); //Strip new line at the end
    go(input);
});

function go(appId) {
    oxr.setOptions({
        app_id : appId,
        base: 'USD' //Set the base currency here if you want to be different from USD (requires paid account)
    });

    console.log('');
    console.log('Requesting currencies list from server...');

    oxr.loadCurrenciesList(function (error) {
        if (error) {
            console.log(error);
        } else {
            console.log(oxr.currencies);
        }

        console.log('');
        console.log('Requesting latest data from server...');

        oxr.loadLatest(function () {
            if (oxr.latest.error) {
                console.error(oxr.latest.error);
            } else {
                console.log("Base currency: " + oxr.latest.base);
                console.log("Timestamp: " + oxr.latest.timestamp);
                console.log("1 EUR = " + oxr.latest.rates.EUR + " " + oxr.latest.base);
                console.log('');
                console.log('Server data:');
                console.log(oxr.latest);
            }

            console.log('');
            console.log('Requesting historical data from server...');

            oxr.loadHistorical('2012-12-22', function () {
                if (oxr.historical.error) {
                    console.error(oxr.historical.error);
                } else {
                    console.log("Base currency: " + oxr.historical.base);
                    console.log("Timestamp: " + oxr.historical.timestamp);
                    console.log("1 EUR = " + oxr.historical.rates.EUR + " " + oxr.historical.base);
                    console.log('');
                    console.log('Server data:');
                    console.log(oxr.historical);
                }

                process.exit();
            });
        });
    });
}
