const express = require('express');
const session = require('express-session');
const { config, engine } = require('express-edge');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const path = require('path');
const fs = require('fs');
const dirTree = require('directory-tree');

const tools = require('./models/tools');
const imgproc = require('./models/imageProc');
var Albums = require('./models/Albums');
const app = new express();

mongoose.promise = global.Promise;

const isProduction = process.env.NODE_ENV === 'production';

app.use(express.static('public'));
app.use(engine);
app.set('views', __dirname + '/views');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'monacanthidae-s', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }));


app.set('json spaces', 2);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
mongoose.connect('mongodb://localhost/monacanthidae-be', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('debug', true);

if(process.env.IN_DOCKER_CONTAINER){
  var rootdir = '/data/'
}else{
  var rootdir = path.join(__dirname + '/data/')
}

app.get('/', async (req, res) => {
    const albums = await Albums
    res.render('index', {
      albums
    });
});

app.get('/l', function(req, res){
  var prom = new Promise(function(resolve, reject) {
    resolve(tools.listImg(req.query.folder))
  });

  prom.then(function(images){
    folder = req.query.folder
    res.render('lister', {
      folder,
      images
    });
  })
});

app.get('/s/', function(req, res){
  // console.log(req.query.folder)
  // console.log(req.query.image)
  imgproc.minFileAs(req.query.image, path.join(rootdir,req.query.folder))
    .then( data => {res.send(data)} )
    .catch(err => res.send("err: " + err));
});

app.get('/p/', function(req, res){
  res.contentType('image/jpeg');
  // console.log(req.query.folder)
  // console.log(req.query.image)
  imgproc.minFilePreview(req.query.image, path.join(rootdir,req.query.folder), req.query.size)
    .then( data => {res.send(data)} )
    .catch(err => res.send("404 file not found"));
});

app.get('/f/', function(req, res){
  res.contentType('image/jpeg');
  res.sendFile(path.join(path.join(rootdir,req.query.folder), req.query.image))
});

app.get('/t', function(req, res){
  delete require.cache[require.resolve('./models/Albums')];
  var Albums = require('./models/Albums');

  res.send("t")
});

if(isProduction){
  console.log("🚧 starting in production")
}

app.listen(3000, function(){
  console.log('✨ listening on *:3000');
});
