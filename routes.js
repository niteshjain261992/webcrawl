const crawler = require("./crawler");

module.exports = (parent)=> {

    parent.post("/webcrawl", (req, res)=> {
        crawler.WebCrawl(req, res);
    });

    parent.get("/search", (req, res)=> {

    })
};