// Express Server

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const consolidate = require('consolidate');
const http = require('http');
const routes = require('./routes');
const socketServer = require('./socket_server_side');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '5mb' }));

app.set('views', 'templates');
app.use('/static', express.static('static'));
app.set('view engine', 'html');
app.engine('html', consolidate.handlebars);
app.use('/', routes);

const db = 'mongodb://localhost:27017/fastaid_db';
mongoose.connect(db).then(() => {
    console.log('Connected to fastaid_db');
}).catch(error => {
    console.log('MongoDB connection error', error);
});

const server = http.Server(app);
const portNumber = 8001;

server.listen(portNumber, () => {
    console.log(`FastAid server listening at port ${portNumber}`);
    socketServer.setUp(server);
});
