const path = require('path');
const fs = require('fs');
const dirTree = require('directory-tree');

const Albums = []

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

function listImgRed(fp){
  p = path.join(rootdir, fp)
  var files = fs.readdirSync(p);
  files = files.filter(isImage);
  files.sort()

  fd = []
  if(files.length > 0){
    fd.push(minFile(files[0], p))
    fd.push(minFile(files[parseInt(files.length/2)], p))
    fd.push(minFile(files[files.length - 1], p))
  }

  return fd
}

function aquireChildren(t, p){
  var arr = []
  for(var i = 0; i < t.length; i++){
    console.log(t[i]["path"].replace(rootdir, ""))
    var pth = t[i]["path"].replace(rootdir, "")
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
    if(t[i]["children"].length > 0){
      var test = []
      return arr.concat(aquireChildren(t[i]["children"], t[i]["name"]))
    }
  }
  return arr
  console.log("done loading Albums")
}

Albums = aquireChildren(dirTree(rootdir, { extensions: /\ / })["children"], "__root__")

module.exports = Albums;
