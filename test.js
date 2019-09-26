const request = require("request");

const options = {
    url: "https://angular.io/",
    headers: {
        "user-agent": "Google"
    },
    method: "GET"
};

request(options, (err, response, body)=> {
    console.log(body);
});