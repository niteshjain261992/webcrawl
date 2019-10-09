const express = require("express");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const database = require("./database");

const app = express();

// parse application/json
app.use(bodyParser.json());

app.use(cookieParser());

app.use(logger('dev'));

// database connection
app.use(async (req, res, next) => {
    try {
        req.client = await database.connect();
        next()
    } catch (e) {
        res.status(400).send({ error: "Error in database connection" });
    }
});

require("./routes")(app);

console.log("Connected with port 3000");
app.listen(3000);
