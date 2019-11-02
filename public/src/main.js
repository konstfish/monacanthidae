//var enc = new TextDecoder("utf-8");

var cur = 0;
var cnt = 0;

var latest = 0;
var update = 0;

function updateProg(){
  document.getElementById("count").innerHTML = cur + '/' + cnt;

  var prc = Math.round((cur / cnt) * 100)
  document.getElementById('chart-slc').style.background = 'conic-gradient(rgb(148, 148, 148) 0% ' + prc + '%, rgb(255, 255, 255) ' + prc + '% 100%)';
}


function checkScroll(){
  if(update){
    last_known_scroll_position = window.scrollY;
    var sc = (Math.round( ( last_known_scroll_position /  Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight)) * 100 ))
    if(sc >= 50 && cur < cnt){
      console.log(cur < cnt)
      console.log(latest)
      update = 0;
      socket.emit('imgrequest', {location: h, latest: latest});
    }
  }
  setTimeout(checkScroll, 500);
}

socket.on('imgdone', function(lid){
  latest = lid
  update = 1
  clear()

  if(lid == cnt){
    var element = document.getElementById('loader-slc');
    element.parentNode.removeChild(element);
  }
})

socket.on('newImg', function(message) {

  var dv = document.createElement("a")
  dv.setAttribute("class", "img-wrapper")
  dv.setAttribute("href", ("/data/" + window.location.pathname.split('/')[window.location.pathname.split('/').length - 1] + "/" + message.name))
  dv.setAttribute("id", message.id)

  var para = document.createElement("img");
  para.setAttribute("src", ("data:image/jpg;base64, " + message.data))
  dv.appendChild(para);

  var prop = document.createElement("div");
  prop.setAttribute("class", "img-info")
  var sp1 = document.createElement("span");
  sp1.innerHTML = message.name
  var sp2 = document.createElement("span");
  sp2.innerHTML = message.width + "x" + message.height
  var sp3 = document.createElement("span");
  sp3.innerHTML = message.updated
  prop.appendChild(sp1)
  prop.appendChild(sp2)
  prop.appendChild(sp3)

  if(message.cr2){
    console.log("crw2")
    var sp4 = document.createElement("span");
    var cr2l = document.createElement("a");
    cr2l.innerHTML = "CR2 DL"
    cr2l.setAttribute("href", ("/data/" + window.location.pathname.split('/')[window.location.pathname.split('/').length - 1] + "/" + message.name.split('.').slice(0, -1).join('.') + '.CR2'))
    sp4.appendChild(cr2l)
    prop.appendChild(sp4)
  }

  dv.appendChild(prop)

  var cnt = document.getElementById("img-container");

  cnt.appendChild(dv);
  cur += 1;

  updateProg();
});

socket.on('imgCount', function(message) {
  cnt = message.data
  updateProg()
});

checkScroll()

// window.addEventListener('scroll', function(e) {
//
//   setTimeout(function(){
//     if(update){
//       var sc = (Math.round( ( last_known_scroll_position /  Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight)) * 100 ))
//       if(sc >= 80 && cur < cnt){
//         console.log(cur < cnt)
//         console.log(latest)
//         update = 0;
//         socket.emit('imgrequest', {location: h, latest: latest});
//       }
//     }
//   });
// });
