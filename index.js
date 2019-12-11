const express = require('express');
const { config, engine } = require('express-edge');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const dirTree = require('directory-tree');
const sharp = require('sharp');
const exif = require('exif-parser');
const app = new express();

app.use(express.static('public'));
app.use(engine);
app.set('views', __dirname + '/views');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}));

app.set('json spaces', 2);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const update_interval = 12;
if(process.env.IN_DOCKER_CONTAINER){
  var rootdir = '/data/'
}else{
  var rootdir = path.join(__dirname + '/data/')
}

async function minFileAs(file, srcdir){
  var dic = {};

  const buffer = fs.readFileSync(srcdir + '/' + file);
  const parser = exif.create(buffer);
  const result = parser.parse();

  dic["make"] = result.tags.Make
  dic["camera"] = result.tags.Model
  dic["lensmodel"] =  result.tags.LensModel
  dic["orientation"] = result.tags.Orientation
  if(dic["orientation"] == 8){
    dic["width"] = result.tags.ExifImageHeight
    dic["heigth"] = result.tags.ExifImageWidth
  }else{
    dic["width"] = result.tags.ExifImageWidth
    dic["heigth"] = result.tags.ExifImageHeight
  }
  dic["iso"] = result.tags.ISO
  dic["exp_time"] = result.tags.ExposureTime
  dic["fnumber"] = result.tags.FNumber
  dic["focallength"] = result.tags.FocalLength

  dic["file"] = file

  dic["upd"] = getFileUpdatedDate(srcdir + '/' + file).toISOString().replace(/T/, ' ').replace(/\..+/, '')
  dic["cr2"] = pathExists(srcdir + '/' + file.split('.').slice(0, -1).join('.') + '.CR2')

  // await sharp(srcdir + '/' + file)
  // .resize(size)
  // .rotate()
  // .toBuffer()
  // .then( data => { dic["b64"] = data.toString('base64') })
  // .catch( err => { console.log(err) });

  return dic;
}

function minFile(file, srcdir){
  var dic = {};

  const buffer = fs.readFileSync(srcdir + '/' + file);
  const parser = exif.create(buffer);
  const result = parser.parse();

  dic["make"] = result.tags.Make
  dic["camera"] = result.tags.Model
  dic["lensmodel"] =  result.tags.LensModel
  dic["orientation"] = result.tags.Orientation
  if(dic["orientation"] == 8){
    dic["width"] = result.tags.ExifImageHeight
    dic["heigth"] = result.tags.ExifImageWidth
  }else{
    dic["width"] = result.tags.ExifImageWidth
    dic["heigth"] = result.tags.ExifImageHeight
  }
  dic["iso"] = result.tags.ISO
  dic["exp_time"] = result.tags.ExposureTime
  dic["fnumber"] = result.tags.FNumber
  dic["focallength"] = result.tags.FocalLength

  dic["file"] = file

  dic["upd"] = getFileUpdatedDate(srcdir + '/' + file).toISOString().replace(/T/, ' ').replace(/\..+/, '')
  dic["cr2"] = pathExists(srcdir + '/' + file.split('.').slice(0, -1).join('.') + '.CR2')

  // await sharp(srcdir + '/' + file)
  // .resize(size)
  // .rotate()
  // .toBuffer()
  // .then( data => { dic["b64"] = data.toString('base64') })
  // .catch( err => { console.log(err) });
  return dic;
}

async function minFilePreview(file, srcdir, size){
  var d;
  await sharp(srcdir + '/' + file)
  .resize(parseInt(size))
  .rotate()
  .toBuffer()
  .then( data => { d = data })
  .catch( err => { console.log(err) });
  return d;
}

const getFileUpdatedDate = (path) => {
  const stats = fs.statSync(path)
  return stats.mtime
}

function isImage(lmnt) {
  if(lmnt.toLowerCase().endsWith('.jpg')){
    return lmnt
  }
}

function isFolder(lmnt) {
  if(fs.lstatSync(rootdir + lmnt).isDirectory()){
    return lmnt
  }
}

function pathExists(path){
  try {
  if (fs.existsSync(path)) {
    return 1
  }else{
    return 0
  }
  } catch(err) {
    return 0
  }
}

function aquireChildren(t, p){
  var arr = []
  for(var i = 0; i < t.length; i++){
    var pth = t[i]["path"].replace(rootdir, "")
    var obj = {
      name: t[i]["name"],
      path: pth,
      prev_imgs: listImgRed(pth),
      parent: p
    }
    arr.push(obj)
    if(t[i]["children"].length > 0){
      var test = []
      return arr.concat(aquireChildren(t[i]["children"], t[i]["name"]))
    }
  }
  return arr
}

function listImgRed(fp){
  p = path.join(rootdir, fp)
  var files = fs.readdirSync(p);
  files = files.filter(isImage);
  files.sort()
  if(files.length > 0){
    fd = []
    fd.push(minFile(files[0], p))
    fd.push(minFile(files[parseInt(files.length/2)], p))
    fd.push(minFile(files[files.length - 1], p))
  }

  return fd
}

function listImg(fp){
  p = path.join(rootdir, fp)
  var files = fs.readdirSync(p);
  files = files.filter(isImage);
  files.sort()

  fd = []
  for(var i = 0; i < files.length; i++){
    fd.push(minFile(files[i], p))
  }

  return fd
}

app.get('/', async (req, res) => {
    var prom = new Promise(function(resolve, reject) {
      resolve(aquireChildren(dirTree(rootdir, { extensions: /\ / })["children"], "__root__"))
    });

    prom.then(function(albums){
      res.render('index', {
        albums
      });
    })
});

app.get('/l', function(req, res){
  var prom = new Promise(function(resolve, reject) {
    resolve(listImg(req.query.folder))
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
  minFileAs(req.query.image, path.join(rootdir,req.query.folder))
    .then( data => {res.send(data)} )
    .catch(err => res.send("err: " + err));
});

app.get('/p/', function(req, res){
  res.contentType('image/jpeg');
  // console.log(req.query.folder)
  // console.log(req.query.image)
  minFilePreview(req.query.image, path.join(rootdir,req.query.folder), req.query.size)
    .then( data => {res.send(data)} )
    .catch(err => res.send("404 file not found"));
});

app.get('/f/', function(req, res){
  res.contentType('image/jpeg');
  res.sendFile(path.join(path.join(rootdir,req.query.folder), req.query.image))
});

app.listen(3000, function(){
  console.log('listening on *:3000');
});
