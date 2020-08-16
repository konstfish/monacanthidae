const express = require('express');
const session = require('express-session');
const { config, engine } = require('express-edge');
const bodyParser = require('body-parser');
//const mongoose = require('mongoose');

const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const dirTree = require('directory-tree');

const tools = require('./models/tools');
const imgproc = require('./models/imageProc');

if(process.env.IN_DOCKER_CONTAINER){
  var rootdir = '/data/'
}else{
  var rootdir = path.join(__dirname + '/data/')
}

var Albums = tools.aquireChildren(dirTree(rootdir, { extensions: /\ / })["children"], "__root__");

var watcher = chokidar.watch(rootdir, {
                        ignored: /[\/\\]\./,
                        persistent: true,
                        usePolling: true,
                        ignoreInitial: true,
                        interval: 2000,
                        binaryInterval: 2500
                    });

watcher
  .on('addDir', function(path){console.log(path); Albums = tools.aquireChildren(dirTree(rootdir, { extensions: /\ / })["children"], "__root__");})

const app = new express();

//mongoose.promise = global.Promise;

const isProduction = process.env.NODE_ENV === 'production';

app.use(express.static('public'));
app.use(engine);
app.set('views', __dirname + '/views');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(session({ secret: 'monacanthidae-s', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }));


app.set('json spaces', 2);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
//mongoose.connect('mongodb://localhost/monacanthidae-be', { useNewUrlParser: true, useUnifiedTopology: true });
//mongoose.set('debug', true);

app.get('/', async (req, res) => {
    const albums = Albums
    res.render('index', {
      albums
    });
});

app.get('/l', function(req, res){
  var prom = new Promise(function(resolve, reject) {
    resolve(tools.listImg(req.query.folder))
  });
  prom
    .then(function(images){
      folder = req.query.folder
      res.render('lister', {
        folder,
        images
      });
    })
    .catch(function(e){
      console.log(e)
      res.send('404')
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
  imgproc.minFilePreview(req.query.image, path.join(rootdir,req.query.folder), req.query.size)
    .then( data => {res.send(data)} )
    .catch(err => res.send("404 file not found"));
});

app.get('/f/', function(req, res){
  if(req.query.folder != undefined && req.query.image != undefined){
    res.contentType('image/jpeg');
    res.sendFile(path.join(path.join(rootdir,req.query.folder), req.query.image))
  }else{
    res.send('404')
  }
});

app.get('/dl/', function(req, res){
  if(req.query.folder != undefined && req.query.image != undefined){
    res.download(path.join(path.join(rootdir,req.query.folder), req.query.image))
  }else{
    res.send('404')
  }
});

if(isProduction){
  console.log("🚧 starting in production")
}

app.listen(3000, function(){
  console.log('✨ listening on *:3000');
});
