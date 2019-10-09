const request = require("request");
const convert = require('xml-js');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;


function getSiteMap(url) {
    return new Promise((resolve, reject) => {
        const options = {
            url,
            method: "GET"
        };

        request(options, async (err, response, body) => {
            if (err) return reject("Invalid domain or sitemap");

            if (response.statusCode === 301) {
                try {
                    resolve(await getSiteMap(response.headers.location))
                } catch (e) {
                    return reject(e)
                }
            }

            if (response.statusCode !== 200) return reject("Invalid domain or sitemap");

            const headers = response.headers;
            if (headers["content-type"].indexOf("application/xml") === -1) return reject("Invalid domain or sitemap");

            try {
                const json = convert.xml2json(body, {compact: true, spaces: 4});
                resolve(JSON.parse(json))
            } catch (e) {
                reject("Invalid domain or sitemap");
            }
        })
    })
}

function getURLs(sitemap) {
    return new Promise(async (resolve, reject) => {
        if (sitemap.urlset) {
            let sitemap_urls = sitemap.urlset.url;
            sitemap_urls = sitemap_urls.map(sitemap_url=> {
                return {
                    loc: sitemap_url.loc._text,
                    lastmod: sitemap_url.lastmod._text,
                    changefreq: sitemap_url.changefreq._text,
                    priority: sitemap_url.priority._text
                }});
            resolve(sitemap_urls);
        } else if (sitemap.sitemapindex) {
            const sitemaps = sitemap.sitemapindex.sitemap;
            let urls = [];
            for (let i = 0; i < sitemaps.length; i++) {
                let sitemap;
                try {
                    sitemap = await getSiteMap(sitemaps[i].loc);
                    urls = urls.concat(await getURLs(sitemap));
                } catch (e) {
                    return reject("Invalid Sitemap");
                    break;
                }
            }
            resolve(urls)
        } else {
            return reject("Invalid Sitemap")
        }
    })
}

function getContent(url) {
    return new Promise((resolve, reject) => {
        var content = '';
        // Here we spawn a phantom.js process, the first element of the
        // array is our phantomjs script and the second element is our url
        var script = path.join(__dirname, '.', 'phantom', 'phantom-server.js');
        var phantom = require('child_process').spawn('phantomjs', [script, url]);
        phantom.stdout.setEncoding('utf8');
        // Our phantom.js script is simply logging the output and
        // we access it here through stdout
        phantom.stdout.on('data', function (data) {
            content += data.toString();
        });
        phantom.on('exit', function (code) {
            if (code !== 0) {
                reject()
            } else {
                // once our phantom.js script exits, let's call out call back
                // which outputs the contents to the page
                resolve(content);
            }
        });
    });
}

function deleteAllDomainRecords(req, domain) {
    return new Promise((resolve, reject) => {
        req.db.collection("crawler").deleteMany({ domain }, (err, response)=> {
            resolve();
        })
    })
}

function addRecord(req, option) {
    return new Promise((resolve, reject)=> {
        req.client.update(option, (err, response)=> {
            resolve();
        });
    })
}

function parseContent(content) {
    return new Promise((resolve, reject)=> {
        const { document } = (new JSDOM(content)).window;
        const options = {
            title: document.title
        };

        const metas = document.getElementsByTagName('meta');

        for (let i = 0; i< metas.length; i++) {
            if (metas[i].getAttribute("name") === "description") {
                options["description"] =  metas[i].getAttribute("content");
            } else if (metas[i].getAttribute("name") === "Keywords") {
                options["keywords"] = metas[i].getAttribute("content");
            }
        }

        resolve(options);
    });
}

function getURLContents(req, domain, urls) {
    return new Promise(async (resolve, reject) => {
        // await deleteAllDomainRecords(req, domain);

        for (let i = 0; i < urls.length; i++) {
            try {
                console.log("i+++++", i);
                const content = await getContent(urls[i].loc);
                const { title } = await parseContent(content);
                const options = {
                    domain,
                    link: urls[i].loc,
                    priority: parseFloat(urls[i].priority),
                    title,
                    content
                };
                await addRecord(req, options);
            } catch (e) {
                console.log("error+++++++++", e);
                // do nothing
            }
        }
        resolve();
    });
}

class Crawler {

    WebCrawl(req, res) {
        const domain = req.body.domain;

        if (!domain) return res.status(406).send({error: "Domain Name is mandatory"});
        const url = `https://${domain}/sitemap.xml`;
        getSiteMap(url)
            .then((sitemap) => {
                return getURLs(sitemap);
            })
            .then((urls) => {
                console.log("urls+++", urls);
                return getURLContents(req, domain, urls);
            })
            .then(()=> {
                res.status(200).send({ message: "Scraped successfully" });
            })
            .catch((err) => {
                res.status(406).send(err);
            })
    }

    Search(req, res) {
        const query = req.query.q;
        let page = req.query.page;
        if (!page || isNaN(page)) page = 0;

        const skip = parseInt(page) * 10;
        if (!query) return res.status(406).send({ error: 'Missing Query' });

        const objQuery = req.client.query().q({
            domain: query,
            link: query,
            title: query,
            content: query
        });
        req.client.search(objQuery, function (err, result) {
            if (err) {
                return res.status(406).send({ error: 'Error in db' });
            }
            res.status(200).send({ data: result.response.docs });
        });
    }

}

module.exports = new Crawler();