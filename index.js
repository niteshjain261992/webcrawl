const express = require("express");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const app = express();

// parse application/json
app.use(bodyParser.json());

app.use(cookieParser());

app.use(logger('dev'));

require("./routes")(app);

app.listen(3000);
