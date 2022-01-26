module.exports = {}
const express = require('express')
const app = express()
const bcrypt = require('bcrypt') //secure password
const passport = require('passport') //to manage logged in state of users
const flash = require('express-flash')
const session = require('express-session') //store and persist user across different pages
const methodOverride = require('method-override')
const mysql = require('mysql');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const publicPath = path.join(__dirname, './public');
const port = process.env.PORT || 3000;
let server = http.createServer(app);
let io = socketIO(server);

let Player = require("./model/Player");

const initializePassport = require('./passport-config')
const { userInfo } = require('os')
const { use } = require('passport')
initializePassport(
    passport,
    email => {
        return new Promise((resolve, reject) => {

            try {
                db.query(
                    ' SELECT * FROM `users` WHERE `email` = ?  ', email,
                    function(err, rows) {
                        if (err) {
                            reject(err)
                        }
                        resolve(rows[0]);
                    }
                );
            } catch (err) {
                reject(err)
            }
        })
    },
    id => {
        return new Promise((resolve, reject) => {

            try {
                db.query(
                    ' SELECT * FROM `users` WHERE `id` = ?  ', id,
                    function(err, rows) {
                        if (err) {
                            reject(err)
                        }
                        resolve(rows[0]);
                    }
                );
            } catch (err) {
                reject(err)
            }
        })
    }
)
const config = {
    "host": "localhost",
    "user": "root",
    "password": "root",
    "base": "mysql_example"
};

let db = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.base
});

db.connect(function(error) {
    if (!!error)
        throw error;

    console.log('mysql connected to ' + config.host + ", user " + config.user + ", database " + config.base);
});

//using ejs
app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

//Set static folder-> send to client
app.use('/client', express.static('./client/'));

let playerName;
let id = 0;

function getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

//home page -> needs authentication to get there

app.get('/', checkAuthenticated, (req, res) => {
    const user = req.user;
    playerName = user.Username;
    user.then(user => {
        res.render('index.ejs', { name: user.Username })
    })
})


app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

//using passport to know the logged in state of users
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render("register.ejs", {
        message: null
    });
})
const userExists = (username) => {
    return new Promise((resolve, reject) => {
        db.query(
            'SELECT id FROM users WHERE username = ?  LIMIT 1', [username],
            (error, result) => {
                if (error) return reject(error);

                if (result && result[0]) {
                    return resolve(true);
                }

                resolve(false);
            });
    });
};
app.post('/register', checkNotAuthenticated, async(req, res) => {
    const exists = await userExists(req.body.name);
    if (!exists) {
        try {
            //password, email = the name field in register.ejs
            //async function pause until Promise is settled
            const hashedPassword = await bcrypt.hash(req.body.password, 10) //secured with bcrypt
            db.query("INSERT INTO users(`Username`,`Email`, `Password`) VALUES(?, ?, ?)", [req.body.name, req.body.email, hashedPassword])
            res.redirect('/login')
        } catch (e) {
            res.redirect('/register')
        }
    } else {
        req.flash('message', "Name already exists");
        res.render("register.ejs", {
            message: req.flash('message'),
        });

    }

})

//instead of post
app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
})

// users not authenticated not allowed to go to home page
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        io.sockets.emit('reloaded', players);
        return next()

    }

    res.redirect('/login')
}
var socket_id;
var players = [];
//users authenticated not going to login page again 
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}



setInterval(heartbeat, 30); //10

function heartbeat() {
    io.sockets.emit('heartbeat', players);
}

function Blob(id, x, y, r, color, name, score) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.r = r;
    this.color = color;
    this.name = name;
    this.score = score;
}

io.sockets.on(
    'connection',
    // We are given a websocket object in our function
    function(socket) {
        console.log('We have a new client: ' + socket.id);
        var blob;
        socket.on('start', function(data) {
            console.log(socket.id + ' ' + data.x + ' ' + data.y + ' ' + data.r + ' ' + data.name + ' ' + data.score);
            blob = new Blob(socket.id, data.x, data.y, data.r, data.color, data.name, data.score);
            players.push(blob);
        });

        socket.on('update', function(data) {
            for (var i = 0; i < players.length; i++) {
                if (socket.id == players[i].id) {
                    socket_id = i; //memorarea locului in array-ul de playeri 
                    players[i].x = data.x;
                    players[i].y = data.y;
                    players[i].r = data.r;
                    players[i].color = data.color;
                    players[i].score = data.score;
                    players[i].name = data.name;

                }
            }
        });

        socket.on('somebdy_eat', function(data) {
            for (var i = 0; i < players.length; i++) {
                if (data.name === players[i].name) {
                    players[i].x = data.x;
                    players[i].y = data.y;
                    players[i].r = data.r;
                    players[i].color = data.color;
                    players[i].score = data.score;
                    players[i].name = data.name;
                }
            }
        });

        socket.on('send-chat-message', message => {
            socket.broadcast.emit('chat-message', { message: message, name: players[socket_id].name });
        })
        socket.on('disconnect', function() {
            console.log('Client has disconnected');
            players.pop(blob);
        });
    }
);
server.listen(3000);
