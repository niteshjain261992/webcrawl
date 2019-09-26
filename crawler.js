const request = require("request");
const parser = require('xml2json');


function getSiteMap(url) {
    return new Promise((resolve, reject)=> {
        const options = {
            url,
            headers: {
                "user-agent": "Google"
            },
            method: "GET"
        };

        request(options, async (err, response, body)=> {
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
                const json = parser.toJson(body);
                resolve(JSON.parse(json))
            } catch(e) {
                reject("Invalid domain or sitemap");
            }
        })
    })
}

function getURLs(sitemap) {
    return new Promise(async (resolve, reject)=> {
        if (sitemap.urlset) {
            const sitemap_urls = sitemap.urlset.url;
            resolve(sitemap_urls);
        } else if (sitemap.sitemapindex) {
            const sitemaps  = sitemap.sitemapindex.sitemap;
            let urls = [];
            for (let i = 0; i < sitemaps.length; i++) {
                console.log("i+++++++++++++++", i);
                let sitemap;
                try {
                    sitemap =  await getSiteMap(sitemaps[i].loc);
                    console.log("site+++++++", sitemaps[i].loc);
                    urls = urls.concat(await getURLs(sitemap));
                } catch(e) {
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

class Crawler {

    WebCrawl(req, res) {
        const domain = req.body.domain;

        if (!domain) return res.status(406).send({ error: "Domain Name is mandatory" });
        const url = `https://${domain}/sitemap.xml`;
        getSiteMap(url)
            .then((sitemap)=> {
                return getURLs(sitemap);
            })
            .then((urls)=> {

            })
            .catch((err)=> {
                res.status(406).send(err);
            })
    }

}

module.exports = new Crawler();