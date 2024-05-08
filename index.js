require('dotenv').config()
const bodyparser = require('body-parser')
const express = require('express');
const studentRouter = require('./Routes/studentRoute');
const adminRouter = require('./Routes/adminRoute');
const cookieparser = require('cookie-parser')
const helmet = require("helmet");
const path = require('path');
var cors = require('cors');

const app = express();

app.use(helmet({
    crossOriginResourcePolicy: false,
}));

var whitelist = ['http://localhost:5173', '192.168.1.33:5173']
var corsOptions = {
  origin: function (origin,  callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      console.log(origin)
      callback(null, true)
      // callback(new Error('Not allowed by CORS'))
    }
  },
  methods: 'GET,POST', // Allow only specified HTTP methods
  credentials: true, // Allow credentials (cookies)
}


app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({extended: true}));

//app.use(cors(corsOptions));

app.use(express.static('public'));
app.use(cookieparser())

app.set('trust proxy', false)


// Body-parser middleware
app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());

app.use('/studentApi/pics', express.static(path.join(__dirname, 'images')));

// app.use(express.static('build'));

// app.get('*',  (req, res) => {
//   res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });


app.listen(5050, console.log('we are listening to port 5050'));


app.use(adminRouter);
app.use(studentRouter);
