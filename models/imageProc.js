const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const exif = require('exif-parser');

const getFileUpdatedDate = (path) => {
  const stats = fs.statSync(path)
  return stats.mtime
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


module.exports = {
  minFileAs: async function (file, srcdir){
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
  },
  minFile: function (file, srcdir){
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
  },

  minFilePreview: async function (file, srcdir, size){
    var d;
    await sharp(srcdir + '/' + file)
    .resize(parseInt(size))
    .rotate()
    .toBuffer()
    .then( data => { d = data })
    .catch( err => { console.log(err) });
    return d;
  }
}
