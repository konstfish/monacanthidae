const path = require('path');
const dirTree = require('directory-tree');
const tools = require('./tools');
const imgproc = require('./imageProc');

if(process.env.IN_DOCKER_CONTAINER){
  var rootdir = '/data/'
}else{
  var rootdir = path.join(__dirname + '../../data/')
}

module.exports = await tools.aquireChildren(dirTree(rootdir, { extensions: /\ / })["children"], "__root__");
