var page = require('webpage').create();
var system = require('system');

var lastReceived = new Date().getTime();
var requestCount = 0;
var responseCount = 0;
var requestIds = [];
var startTime = new Date().getTime();

page.onResourceReceived = function (response) {
    if (requestIds.indexOf(response.id) !== -1) {
        lastReceived = new Date().getTime();
        responseCount++;
        requestIds[requestIds.indexOf(response.id)] = null;
    }
};

page.onResourceRequested = function (requestData, request) {
    if ((/google-analytics.com/gi).test(requestData.url) ||
        (/api.mixpanel.com/gi).test(requestData.url) ||
        (/fonts.googleapis.com/gi).test(requestData.url) ||
        (/stats.g.doubleclick.net/gi).test(requestData.url) ||
        (/mc.yandex.ru/gi).test(requestData.url)) {
        request.abort();
    }
    if (requestIds.indexOf(request.id) === -1) {
        requestIds.push(request.id);
        requestCount++;
    }
};

page.customHeaders = {
    'msphantom': '1'
};

page.settings = {
    loadImages: false,
    javascriptEnabled: true
};

// Open the page
page.open(system.args[1], function (status) {
    if (status !== 'success') {
        console.log('FAIL to load the url ');
    }

});

var checkComplete = function () {
    // We don't allow it to take longer than 5 seconds but
    // don't return until all requests are finished
    if ((new Date().getTime() - lastReceived > 300 && requestCount === responseCount) || new Date().getTime() - startTime > 20000) {
        clearInterval(checkCompleteInterval);
        console.log(page.content);
        phantom.exit();
    }
};

// Let us check to see if the page is finished rendering
var checkCompleteInterval = setInterval(checkComplete, 1);

/*window.setTimeout(function () {
 console.log(page.content);
 phantom.exit();
 }, 1000);*/
