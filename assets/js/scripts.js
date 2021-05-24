// CONSTANTS
const patt = /^[a-zA-Z0-9]*$/;
const baseUrl = window.location.host;
const protocol = window.location.protocol;
const audio = document.querySelector(".current-music");
const currentTimeContainer = document.querySelector('.current-time');
const playIconContainer = document.querySelector("#play-button");
const seekSlider = document.querySelector("#seek-slider");
const playingLottieAnimation = document.createElement("lottie-player");
const playPauseButton = document.createElement("i");
const durationContainer = document.querySelector('.duration');
const volumeSlider = document.getElementById('volume-slider');
const outputContainer = document.getElementById('volume-output');





playPauseButton.setAttribute("aria-hidden", true);
playingLottieAnimation.setAttribute("loop", true);
playingLottieAnimation.setAttribute("autoplay", true);
playingLottieAnimation.setAttribute("src", "https://assets2.lottiefiles.com/private_files/lf30_oMQCYI.json");
playingLottieAnimation.setAttribute("background", "transparent");
playingLottieAnimation.setAttribute("speed", "1");

// VARIABLES
var currentMusic;
var pausedAt;
var paused = false;
let rAF = null;
var playState = "pause";
var currentVolume = 100;
var random = false;
var repeat = false;

var musicOrderLinear = [];

document.querySelectorAll(".song-card").forEach((card)=>{musicOrderLinear.push(card.getAttribute("value"))});
var shuffleOrder = [];
var shuffleIndex = 0;

function shuffleMusic(){
  const shuffleOrderTemp = [];



  shuffleOrderTemp.push(currentMusic);

  var tempArray = musicOrderLinear.filter((e)=>(e!= currentMusic));

  var currentIndex = tempArray.length;

  while(0 !== currentIndex){
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex-=1;

    var tempValue = tempArray[currentIndex];
    tempArray[currentIndex] = tempArray[randomIndex];
    tempArray[randomIndex] = tempValue;

    shuffleOrderTemp.push(Number(tempArray[currentIndex]));
  }

  shuffleOrder = shuffleOrderTemp;
}


const setSliderMax = () => {
  seekSlider.max = Math.floor(audio.duration);
}

const whilePlaying = () => {
  seekSlider.value = Math.floor(audio.currentTime);
  currentTimeContainer.innerText = calculateTime(seekSlider.value);
  if(audio.buffered.length > 0){
    const bufferedAmount = Math.floor(audio.buffered.end(audio.buffered.length - 1));
    const seeked = seekSlider.value / seekSlider.max * 100;
    const buffered = bufferedAmount / seekSlider.max * 100;
    const sliderColor = `linear-gradient(90deg, #82CFD0 0%, #82CFD0 ${seeked}% , #B0B0B0 ${(seeked)}%, #B0B0B0 ${buffered}%, #ffffff ${buffered}%, #ffffff 100%)`;
    seekSlider.style.background = sliderColor;
  }
  raf = requestAnimationFrame(whilePlaying);
}

const calculateTime = (secs) => {
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  const returnedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${minutes}:${returnedSeconds}`;
}

const displayDuration = () => {
  durationContainer.innerText = calculateTime(audio.duration);
}



if(audio){
  if (audio.readyState > 0) {
    displayDuration();
    setSliderMax();
  } else {
    audio.addEventListener('loadedmetadata', () => {
      playIconContainer.classList = "fa fa-pause";
      playState = "play";
      displayDuration();
      setSliderMax();
      whilePlaying();
      $("#shuffle-container")[0].innerHTML = '<i class="fas fa-random text-muted"></i>';
      $("#repeat-container")[0].innerHTML = '<i class="fas fa-redo text-muted"></i>';
      audio.play();
    });
  }
  audio.addEventListener("progress", whilePlaying);
  seekSlider.addEventListener('input', () => {

    if(currentMusic === undefined){seekSlider.value = 0;return;}
    currentTimeContainer.innerText = calculateTime(seekSlider.value);
    audio.currentTime = seekSlider.value;

    if(!audio.paused) {
      cancelAnimationFrame(rAF);
    }
  });

  seekSlider.addEventListener('change', (e) => {

    if(currentMusic === undefined){seekSlider.value = 0;return;}
    audio.currentTime = seekSlider.value;

    if(!audio.paused) {
      requestAnimationFrame(whilePlaying);
    }
  });

  playIconContainer.addEventListener('click', () => {
    if(currentMusic === undefined){return;}
    if(playState === 'pause') {
      audio.play();
      requestAnimationFrame(whilePlaying);
      playIconContainer.classList = "fa fa-pause";
      playState = 'play';
    } else {
      audio.pause();
      playIconContainer.classList = "fa fa-play";
      cancelAnimationFrame(rAF);
      playState = 'pause';
    }
  });

  audio.addEventListener("pause", ()=>{
    playState = "pause";
    playIconContainer.classList = "fa fa-play";
  })

  audio.addEventListener("play", ()=>{
    playState = "play";
    seekSlider.style.background = "#ffffff";
    playIconContainer.classList = "fa fa-pause";
  })

  audio.addEventListener("ended", ()=>{
    if(repeat){
      audio.currentTime = 0;
      audio.play();
      return;
    }
    $(".fa-fast-forward").trigger("click");
  })

  audio.addEventListener('timeupdate', () => {
    seekSlider.value = Math.floor(audio.currentTime);
  });

}






$(".song-card").mouseenter(function(){
  this.classList.add("bg-light");
  if(currentMusic === Number(this.getAttribute("value"))){
    this.querySelector(".play-button").innerHTML = (playState === "play") ?  '<i class = "fa fa-pause" aria-hidden></i>' : '<i class = "fa fa-play" aria-hidden></i>';
  }else{
    this.querySelector(".play-button").classList.add("visible");
  }
})

$(".song-card").mouseleave(function(){
  this.classList.remove("bg-light");
  if(currentMusic === Number(this.getAttribute("value"))){
    this.querySelector(".play-button").innerHTML = '<lottie-player src="https://assets10.lottiefiles.com/packages/lf20_cWQSb4.json"  background="transparent"  speed="1"  style="width: 24px; height: 24px;"  loop  autoplay></lottie-player>';
    this.querySelector(".play-button").classList.add("visible");
  }else{
    this.querySelector(".play-button").classList.remove("visible");
  }
})


$(document).on("click", ".fa-random", function(){
  this.classList.toggle("text-muted");
  random = !random;
  if(random){
    shuffleMusic();
  }
})

$(document).on("click", ".fa-redo", function(){
  this.classList.toggle("text-muted");
  repeat = !repeat;

})




$(".fa-fast-forward").click(function(){

  if(currentMusic ===  undefined){return;}

  if(repeat){
    audio.currentTime = 0;
    audio.play();
    return;
  }

  const songCardList =  document.querySelectorAll(".song-card");

  if(random){
    shuffleIndex = (shuffleIndex + 1 < shuffleOrder.length) ? shuffleIndex + 1 : 0;
    const nextMusicIndex = shuffleOrder[shuffleIndex];
    songCardList[nextMusicIndex].querySelector(".play-button").click();
  }else{
    songCardList[(currentMusic + 1 < songCardList.length) ? currentMusic+1 : 0].querySelector(".play-button").click();
  }
})

$(".fa-fast-backward").click(function(){
  if(currentMusic === undefined){return;}
  const songCardList = document.querySelectorAll(".song-card");

  const playedPart = (audio.currentTime/audio.duration) * 100;

  if(playedPart > 10){
    audio.currentTime = 0;
    audio.play();
    return;
  }


  if(repeat){
    audio.currentTime = 0;
    audio.play();
    return;
  }

  if(random){
    shuffleIndex = (shuffleIndex - 1 > 0) ? shuffleIndex - 1 : shuffleOrder.length - 1;
    const nextMusicIndex = shuffleOrder[shuffleIndex];

    songCardList[nextMusicIndex].querySelector(".play-button").click();
  }else{
    songCardList[(currentMusic - 1 >= 0) ? currentMusic-1 : 0].querySelector(".play-button").click();
  }
})

$(".play-button").click(function(){
  const filename = $(this).val();
  const url = `${protocol}//${baseUrl}/music/file/${filename}`;
  const songCard = $(this).closest(".song-card")[0];
  const title = songCard.querySelector(".song-title").innerText;
  const singer = songCard.querySelector(".song-singer").innerText;
  const index = Number(songCard.getAttribute("value"));
  const likedButton = songCard.querySelector(".fa-heart");

  if(currentMusic === index){
    if(playState === 'pause') {
      audio.play();
      requestAnimationFrame(whilePlaying);
      playIconContainer.classList = "fa fa-pause";
      this.innerHTML = '<i class = "fa fa-pause" aria-hidden></i>'
      playState = 'play';
    } else {
      audio.pause();
      playIconContainer.classList = "fa fa-play";
      this.innerHTML = '<i class = "fa fa-play" aria-hidden></i>'
      cancelAnimationFrame(rAF);
      playState = 'pause';
    }
    return;
  }else{
    if(currentMusic != undefined){
      $(".play-button")[currentMusic].innerHTML = '<i class = "fa fa-play" aria-hidden></i>';
      $(".play-button")[currentMusic].classList.remove("visible");
    }
  }

  seekSlider.style.background = "#ffffff";
  currentMusic = index;
  this.innerHTML = '<lottie-player src="https://assets10.lottiefiles.com/packages/lf20_cWQSb4.json"  background="transparent"  speed="1"  style="width: 24px; height: 24px;"  loop  autoplay></lottie-player>';
  this.classList.add("visible");
  if(window.location.pathname !== "/admin"){
    if(likedButton.classList.contains("liked")){
      $(".liked-button-container")[0].innerHTML = '<i name= "musicId" value="'+ likedButton.getAttribute("value") + '" class="fa fa-heart liked" aria-hidden="true"></i>';
    }else{
      $(".liked-button-container")[0].innerHTML = '<i name= "musicId" value="'+likedButton.getAttribute("value")+'" class="fa fa-heart" aria-hidden="true"></i>'
    }
  }
  $(".current-music-title").text(title);
  $(".current-music-singer").text(singer);
  $(".current-music-picture")[0].innerHTML = '<img class="w-100" src="song.jpg" alt="...">';

  audio.setAttribute("src", url);
});


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

  var key = String(e.key);
  var curVal = $(this).val();

  if(patt.test(key) && key.length === 1){}else{return;}
  var id = Number( $(this).attr("id").substr(4,5));

  $(this).val(key);

  var pinBoxes = $(".pinBox");

  if(id === pinBoxes.length){pinBoxes[id-1].blur(); return;}
  pinBoxes[id].focus();
});


$(".deleteButton").click(async function(e){

  const musicId = $(this).val();


  $(this).attr("disabled", true);

  const response = await fetch(`${protocol}//${baseUrl}/music/delete/${musicId}`,{
    method : 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const temp = await response.json();


  var row = $(this).closest('tr');
  row.addClass("bg-light");
  row.hide(1500, function(){
    this.remove();
  });

});

$("#mute-icon").on("click", function(e){
  const muteIcon = this.firstElementChild;
  if(muteIcon.classList.contains("fa-volume-up")){
    muteIcon.classList.remove("fa-volume-up");
    muteIcon.classList.add("fa-volume-mute");
    $("#volume-slider").val(0);
    $("#volume-output").text(0);
    audio.volume = 0;
  }else if(muteIcon.classList.contains("fa-volume-mute")){
    muteIcon.classList.remove("fa-volume-mute");
    muteIcon.classList.add("fa-volume-up");
    $("#volume-slider").val(currentVolume);
    $("#volume-output").text(currentVolume);
    audio.volume = currentVolume/100;
  }
})

$("#volume-slider").on("change", function(e){
  const value = Number(e.target.value);

  if(value !== 0){
    currentVolume = value;
  }
})

$("#volume-slider").on("input", function(e){
  const value = Number(e.target.value);
  if(value === 0){
    $("#mute-icon").trigger("click");
  }else{
    const muteIcon = $("#mute-icon")[0].firstElementChild;
    if(muteIcon.classList.contains("fa-volume-mute")){
      muteIcon.classList.remove("fa-volume-mute");
      muteIcon.classList.add("fa-volume-up");
      $("#volume-slider").val(value);
      $("#volume-output").text(value);
      audio.volume = value/100;
    }
  }
  $("#volume-output").text(value);
  audio.volume = value/100;
})

$(".edit-button").click(function(e){

    const musicId = this.getAttribute("value");
    const card = $(this).closest(".song-card")[0];
    const currentTitle = card.querySelector(".song-title").innerText;
    const currentSinger = card.querySelector(".song-singer").innerText;
    const currentFilename = card.querySelector(".play-button").getAttribute("value");

    $("#edit-song-filename").val(currentFilename);
    $("#edit-song-title").val(currentTitle);
    $("#edit-song-singer").val(currentSinger);
    $(".edit-form")[0].querySelector("form").setAttribute("action", `music/update/without-file/${musicId}`);

});

$("#edit-song-upload").on("change", function(){
  const temp = this.form.getAttribute("action");
  const url = temp.replace("without-file/", "");

  this.form.setAttribute("enctype" , "multipart/form-data");
  $(".edit-form")[0].querySelector("form").setAttribute("action", url);
})


$(document).on("mousedown",".fa-heart",function(){
  this.classList.add("enlarge");
})

$(document).on("mouseup", ".fa-heart", async function(){
  this.classList.remove("enlarge");
  this.classList.toggle("liked");



  const musicId = this.getAttribute("value");
  const data = {
    musicId,
  };

  if(this.parentNode.classList[0] === "card-text"){
    $(".liked-button-container")[0].classList.toggle("liked");
    if(window.location.pathname === "/profile"){
      $($(this).closest(".song-card")).addClass("bg-light");
      $($(this).closest(".song-card")).hide(1500, function(){
        this.remove();
      })
    }
  }else{
    if(currentMusic !== undefined){
      $(".song-card")[currentMusic].querySelector(".fa-heart").classList.toggle("liked");
    }
  }

  const response = await fetch(`${protocol}//${baseUrl}/profile`,{
    method : 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body : JSON.stringify(data),
  });


  if(response.url === `${protocol}//${baseUrl}/login`){
    return window.location.href = `${protocol}//${baseUrl}/login`;
  }

  const temp = await response.json();
})
