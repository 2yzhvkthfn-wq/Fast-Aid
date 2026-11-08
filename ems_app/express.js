// Express Server

const express = require('express');
const bodyParser = require('body-parser');
//const cookieParser = require('cookie-parser'); // For storing JWT in cookies
const mongoose = require('mongoose'); // mongodb driver for node.js
const consolidate = require('consolidate'); // library to choose template engine
const http = require('http');
const routes = require('./routes');
const socketServer = require('./socket_server_side');

const app = express();


app.use(bodyParser.urlencoded({ extended: true })); // Middleware to parse the body of requests (req.body)
app.use(bodyParser.json({ limit: '5mb' }));
//app.use(cookieParser()); // Parse cookies

app.set('views', 'templates');
app.use('/static', express.static('static'));
app.set('view engine', 'html');
app.engine('html', consolidate.handlebars);
app.use('/', routes); // no prefix for API endpoints


const db = 'mongodb://localhost:27017/ems_db'; // connect to ems_db with mongoose
mongoose.connect(db).then(value => {
    console.log(value.models);
}).catch(error => {
    console.log('MongoDB connection erorr', error);
});


const server = http.Server(app);
const portNumber = 8000;

server.listen(portNumber, () => {
    console.log(`Server listening at port ${portNumber}`);
    socketServer.setUp(server); // Function to set up SocketIO server
});

