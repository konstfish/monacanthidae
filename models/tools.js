const path = require('path');
const fs = require('fs');
const dirTree = require('directory-tree');
const imgproc = require('./imageProc');

if(process.env.IN_DOCKER_CONTAINER){
  var rootdir = '/data/'
}else{
  var rootdir = path.join(__dirname + '../../data/')
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

function listImgRed(fp){
  p = path.join(rootdir, fp)
  var files = fs.readdirSync(p);
  files = files.filter(isImage);
  files.sort()

  fd = []
  if(files.length > 0){
    fd.push(imgproc.minFile(files[0], p))
    fd.push(imgproc.minFile(files[parseInt(files.length/2)], p))
    fd.push(imgproc.minFile(files[files.length - 1], p))
  }

  return fd
}

module.exports = {
  // getFileUpdatedDate: function(path){
  //   const stats = fs.statSync(path)
  //   return stats.mtime
  // },
  //
  // isImage: function(lmnt) {
  //   if(lmnt.toLowerCase().endsWith('.jpg')){
  //     return lmnt
  //   }
  // },
  //
  // isFolder: function(lmnt) {
  //   if(fs.lstatSync(rootdir + lmnt).isDirectory()){
  //     return lmnt
  //   }
  // },
  //
  // pathExists: function(path){
  //   try {
  //   if (fs.existsSync(path)) {
  //     return 1
  //   }else{
  //     return 0
  //   }
  //   } catch(err) {
  //     return 0
  //   }
  // },

  aquireChildren: function(t, p){
    var arr = []
    console.log(t)
    for(var i = 0; i < t.length; i++){
      //console.log(t[i]["path"].replace(rootdir, ""))
      var pth = t[i]["path"].replace(rootdir, "")
      console.log(pth)
      if(isFolder(pth)){
        var lstImgRe = listImgRed(pth)
        if(lstImgRe.length != 0){
          var obj = {
            name: t[i]["name"],
            path: pth,
            prev_imgs: lstImgRe,
            parent: p
          }
          arr.push(obj)
        }
      }
      if(t[i]["children"].length > 0){
        var test = []
        return arr.concat(module.exports.aquireChildren(t[i]["children"], t[i]["name"]))
      }
    }
    return arr
  },

  listImg: function(fp){
    p = path.join(rootdir, fp)
    var files = fs.readdirSync(p);
    files = files.filter(isImage);
    files.sort()

    fd = []
    for(var i = 0; i < files.length; i++){
      fd.push(imgproc.minFile(files[i], p))
    }

    return fd
  }
};
