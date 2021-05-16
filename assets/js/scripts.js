$('.password i').on('click', function() {
  if ($('.password input').attr('type') === 'password') {
    $('.password input').attr('type', 'text');
    $('.password i').removeClass('fa-eye-slash').addClass('fa-eye');
  } else {
    $('.password input').attr('type', 'password');
    $('.password i').removeClass('fa-eye').addClass('fa-eye-slash');
  }
});


$(".pinBox").on("keyup", function(e){

  var patt = /^[a-zA-Z0-9]*$/;

  var key = String(e.key);
  var curVal = $(this).val();

  if(patt.test(key) && key.length === 1){}else{return;}
  var id = Number( $(this).attr("id").substr(4,5));

  if(curVal.length === 1){$(this).val(key);}

  var pinBoxes = $(".pinBox");

  if(id === pinBoxes.length){pinBoxes[id-1].blur(); return;}
  pinBoxes[id].focus();
});


$(".likeButton").click(async function(e){
  e.preventDefault();

  const musicId = $(this).val();

  const baseUrl = window.location.host;
  const protocol = window.location.protocol;

  const data = {
    musicId,
  };

  const response = await fetch(`${protocol}//${baseUrl}/profile`,{
    method : 'POST',
    headers: {
      'Content-Type': 'application/json',
      //'Content-Type': 'application/x-www-form-urlencoded',
    },
    body : JSON.stringify(data),
  });


  if(response.url === `${protocol}//${baseUrl}/login`){
    return window.location.href = `${protocol}//${baseUrl}/login`;
  }

  const temp = await response.json();


  if(temp.message === "Like"){
    $(this).text("Dislike");
  }else{
    $(this).text("Like");
  }
})

$(".profileButton").click(async function(e){

  const musicId = $(this).val();

  const baseUrl = window.location.host;
  const protocol = window.location.protocol;

  const data = {
    musicId,
  };

  const response = await fetch(`${protocol}//${baseUrl}/profile`,{
    method : 'POST',
    headers: {
      'Content-Type': 'application/json',
      //'Content-Type': 'application/x-www-form-urlencoded',
    },
    body : JSON.stringify(data),
  });

  const temp = await response.json();

  $(this).closest(".card.mb-3").slideUp();
})

var curMusic;
var curMusicIndex;
var paused = false;
var pausedAt;
var startedAt;
var playSound;



async function playMusic(fileName, index) {

  const ctx = new AudioContext();
  let audio;

  var button = document.querySelectorAll(".btn.btn-danger.me-3");


  if(fileName != curMusic && playSound){
    button[curMusicIndex].innerText = "Play";
    button[curMusicIndex].setAttribute("onclick",`playMusic('${curMusic}', ${curMusicIndex})`);
    playSound.stop();
    pausedAt = null;
  }

  curMusic = fileName;
  curMusicIndex = index;



  button[index].innerText = "Stop";
  button[index].setAttribute("onclick", `stopMusic('${fileName}', ${index})`);


  const baseUrl = window.location.host;
  const protocol = window.location.protocol;

  await fetch(`${protocol}//${baseUrl}/music/file/${fileName}`)
  .then(data => {return data.arrayBuffer();})
  .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
  .then(decodedAudio =>{
    audio = decodedAudio;
  });


  playSound = ctx.createBufferSource();
  playSound.buffer = audio;
  playSound.connect(ctx.destination);


  paused = false;


  if(!pausedAt){
    playSound.start(0);
    startedAt = Date.now();
  }else{
    playSound.start(0, pausedAt/1000);
    startedAt = Date.now() - pausedAt;
  }

}

async function stopMusic(fileName,index){

  playSound.stop();
  paused = true;
  pausedAt = Date.now() - startedAt;

  var button = document.querySelectorAll(".btn.btn-danger.me-3");


  button[index].innerText = "Play";
  button[index].setAttribute("onclick",`playMusic('${fileName}', ${index})`);
}
