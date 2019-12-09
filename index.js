const express = require('express');
const { config, engine } = require('express-edge');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const dirTree = require('directory-tree');
const sharp = require('sharp');
var ExifImage = require('exif').ExifImage;
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
  dic["file"] = file

  // new ExifImage({ image : srcdir + '/' + file}, function (error, exifData) {
  // if (error)
  //   console.log('Error: '+error.message);
  // else
  //   console.log(exifData);
  //   dic["camera"] = exifData["image"]["Model"]
  //   dic["manu"] = exifData["image"]["Make"]
  //   dic["lens"] = exifData["exif"]["LensModel"]
  //   dic["orientatio1n"] = exifData["image"]["Orientation"]
  //   if(dic["orientation"] == 8){
  //     dic["width"] = exifData["exif"]["ExifImageHeight"]
  //     dic["heigth"] = exifData["exif"]["ExifImageWidth"]
  //   }else{
  //     dic["width"] = exifData["exif"]["ExifImageWidth"]
  //     dic["heigth"] = exifData["exif"]["ExifImageHeight"]
  //   }
  //   dic["iso"] = exifData["exif"]["ISO"]
  //   dic["exp_time"] = exifData["exif"]["ExposureTime"]
  //   console.log(dic)
  // });

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

function getExifData(f){
  var dic = {};
  new ExifImage({ image : f}, function (error, exifData) {
  if (error)
    console.log('Error: '+error.message);
  else
    dic["camera"] = exifData["image"]["Model"]
    dic["manu"] = exifData["image"]["Make"]
    dic["lens"] = exifData["exif"]["LensModel"]
    dic["orientatio1n"] = exifData["image"]["Orientation"]
    if(dic["orientation"] == 8){
      dic["width"] = exifData["exif"]["ExifImageHeight"]
      dic["heigth"] = exifData["exif"]["ExifImageWidth"]
    }else{
      dic["width"] = exifData["exif"]["ExifImageWidth"]
      dic["heigth"] = exifData["exif"]["ExifImageHeight"]
    }
    dic["iso"] = exifData["exif"]["ISO"]
    dic["exp_time"] = exifData["exif"]["ExposureTime"]
  });
  return dic
}

function minFile(file, srcdir){
  var dic = {};
  // var prom = new Promise(function(resolve, reject) {
  //   resolve(getExifData(srcdir + '/' + file))
  // });
  //
  // prom.then(function(d){
  //   dic = d;
  // });

  dic["file"] = file


  dic["upd"] = getFileUpdatedDate(srcdir + '/' + file).toISOString().replace(/T/, ' ').replace(/\..+/, '')
  dic["cr2"] = pathExists(srcdir + '/' + file.split('.').slice(0, -1).join('.') + '.CR2')

  // await sharp(srcdir + '/' + file)
  // .resize(size)
  // .rotate()
  // .toBuffer()
  // .then( data => { dic["b64"] = data.toString('base64') })
  // .catch( err => { console.log(err) });
  console.log(dic)
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
    var obj = {
      name: t[i]["name"],
      path: t[i]["path"].replace(rootdir, ""),
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

minFile("IMG_0170.JPG", rootdir + "/" + "shoot_frankfurt_hood")


app.get('/', async (req, res) => {
    var prom = new Promise(function(resolve, reject) {
      resolve(aquireChildren(dirTree(rootdir, { extensions: /\ / })["children"], "__root__"))
    });

    prom.then(function(albums){
      console.log(albums)
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
    console.log("images")
    folder = req.query.folder
    res.render('lister', {
      folder,
      images
    });
  })
});

app.get('/s/', function(req, res){
  console.log(req.query.folder)
  console.log(req.query.image)
  minFileAs(req.query.image, path.join(rootdir,req.query.folder))
    .then( data => {res.send(data)} )
    .catch(err => res.send("err: " + err));
});

app.get('/p/', function(req, res){
  res.contentType('image/jpeg');
  console.log(req.query.folder)
  console.log(req.query.image)
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
