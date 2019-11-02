var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const sharp = require('sharp');
const sizeOf = require('image-size');

const update_interval = 12;
if(process.env.IN_DOCKER_CONTAINER){
  var rootdir = '/data/'
}else{
  var rootdir = path.join(__dirname + '/data/')
}

async function minFile(file, srcdir, id, cid){
  var b64;
  var dimensions = sizeOf(srcdir + '/' + file);
  if(dimensions.orientation == 8){
    var width = dimensions.height
    var height = dimensions.width
  }else{
    var height = dimensions.height
    var width = dimensions.width
  }

  var upd = getFileUpdatedDate(srcdir + '/' + file).toISOString().replace(/T/, ' ').replace(/\..+/, '')
  var cr2 = pathExists(srcdir + '/' + file.split('.').slice(0, -1).join('.') + '.CR2')
  console.log("cr2:" + cr2)

  await sharp(srcdir + '/' + file)
  .resize(900)
  .rotate()
  .toBuffer()
  .then( data => { b64 = data.toString('base64') })
  .catch( err => { console.log(err) });


  io.to(cid).emit('newImg', { data: b64, name: file, id: id, height: height, width: width, orientation: dimensions.orientation, updated: upd, cr2: cr2 });
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

app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/list/:arg', function(req, res){
  var dir = req.params.arg
  res.sendFile(__dirname + '/public/folder.html');
});

app.get('/src/:path', function(req, res){
  res.sendFile(__dirname + '/public/src/' + req.params.path);
});

app.get('/data/:folder/:image', function(req, res){
  res.sendFile(rootdir + req.params.folder + "/" + req.params.image);
});

io.on('connection', function(client){
  console.log('a user connected');
  client.on('imgrequest', function(data) {
    var srcdir = path.join(rootdir, data["location"]);

    fs.readdir(srcdir, function (err, files) {
      if (err) {
          return console.log('Unable to scan directory: ' + err);
      }

      files = files.filter(isImage);
      files.sort()

      if(data["latest"] == 0){
        io.to(client.id).emit('imgCount', { data: files.length })
      }

      var id = data["latest"];
      var until = data["latest"] + update_interval;

      while(id < files.length && id < until){
        minFile(files[id], srcdir, id, client.id)
        id = id + 1;
      }

      io.to(client.id).emit('imgdone', id)

    });
  });
  client.on('linkrequest', function(data) {
    fs.readdir(rootdir, function (err, files) {
      if (err) {
          return console.log('Unable to scan directory: ' + err);
      }

      files = files.filter(isFolder);
      files.sort()

      files.forEach(function(file){
        io.to(client.id).emit('newlink', file)
      });
    });
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
