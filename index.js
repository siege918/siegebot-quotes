var execSync = require('child_process').execSync;
var exec = require('child_process').exec;
var cachedLengths = {};

function getLength(message, config, callback) {
    if (!cachedLengths[config.file])
    {
        var output = execSync("wc " + config.file).toString().trim();
        var spaceIndex = output.indexOf(" ");
        cachedLengths[config.file] = parseInt(output.substring(0, spaceIndex)) + 1;
    }
    if (callback)
        callback(cachedLengths[config.file]);
    return cachedLengths[config.file];
};
    
function search(message, config, callback) {
    var q = message.content.substring(message.content.indexOf(' ')).trim();
    exec('grep -n -i "' + q + '" ' + config.file + ' |cut -f1 -d:', function (error, result)
    {
        var resultString = result.toString().replace(/[\n\r]/g, ", ");
        resultString = resultString.substring(0, resultString.length - 2);
        callback(resultString);
    });
}

function get (message, config, callback) {
    var splitString = message.content.split(" ");
    var quoteId = 0;
    if (splitString.length > 1) {
        var potentialNum = splitString[1];
        quoteId = parseInt(potentialNum);
        if (isNaN(quoteId))
        {
            quoteId = false;
        }
    }

    if (!quoteId) {
        quoteId = Math.floor((Math.random() * getLength(message, config))) + 1;
    }
    exec("awk NR==" + quoteId + " " + config.file, function (error, result) {
        callback(result.trim().replace(/\\n/g, "\n")  + " (" + (quoteId) + ")");
    });
}

function searchPromise(message, config) {
    return new Promise(function(resolve) {
		search(message, config, function(quote) {
            var response = "Didn't find any quotes with that in it.";
            if (quote)
            {
                response = "Try these quotes: " + quote;
            }

            message.channel.send(response);
            resolve(response);
        });
	});
}

function getPromise(message, config) {
    return new Promise(function(resolve) {
        get(message, config, function(quote) {
            message.channel.send(quote);
            resolve(quote);
        })
    });
}

function countPromise(message, config) {
    return new Promise(function(resolve) {
        getLength(
            message, config, function(count) {
                message.channel.sendMessage("There are " + getLength(message, config) + " quotes.");
                resolve("There are " + getLength(message, config) + " quotes.");
            }
        );
    });
}

module.exports = {
	length: countPromise,
	search: searchPromise,
	get: getPromise
}