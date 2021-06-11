// CONSTANTS
const patt = /^[a-zA-Z0-9]*$/;
const baseUrl = window.location.host;
const protocol = window.location.protocol;
const audio = document.querySelector(".current-music");
const currentTimeContainer = document.querySelectorAll('.current-time p');
const playIconContainer = document.querySelectorAll(".play-icon-button");
const seekSlider = document.querySelectorAll(".seek-slider");
const durationContainer = document.querySelectorAll('.duration p');
const volumeSlider = document.querySelectorAll('.volume-slider');
const outputContainer = document.querySelectorAll('.volume-output');
const muteIcon = document.querySelectorAll(".mute-icon");
const audioController = document.querySelector(".audio-controller");


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
var shuffleOrder = [];
var shuffleIndex = 0;
var clickedPlay = false;
var position = [];


document.querySelectorAll(".song-card").forEach((card) => {
  musicOrderLinear.push(card.getAttribute("value"))
});


// SHUFFLE ALGORITHM (PUSH SHUFFLED MUSIC TO SHUFFLED ORDER)
function shuffleMusic() {

  const shuffleOrderTemp = [];
  shuffleOrderTemp.push(currentMusic);

  var tempArray = musicOrderLinear.filter((e) => (e != currentMusic));
  var currentIndex = tempArray.length;

  while (0 !== currentIndex) {

    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    var tempValue = tempArray[currentIndex];
    tempArray[currentIndex] = tempArray[randomIndex];
    tempArray[randomIndex] = tempValue;

    shuffleOrderTemp.push(Number(tempArray[currentIndex]));
  }

  shuffleOrder = shuffleOrderTemp;
}


// CHECK IOS DEVICE
function isIOSDevice(){
   return !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
}


// SET SEEK SLIDER MAX VALUE TO AUDIO DURATION
const setSliderMax = () => {

  seekSlider[0].max = Math.floor(audio.duration);
  seekSlider[1].max = Math.floor(audio.duration);
}

// ANIMATION FRAME WHILE AUDIO IS PLAYING
const whilePlaying = () => {

  seekSlider[0].value = Math.floor(audio.currentTime);
  seekSlider[1].value = Math.floor(audio.currentTime);

  currentTimeContainer[0].innerText = calculateTime(seekSlider[0].value);
  currentTimeContainer[1].innerText = calculateTime(seekSlider[1].value);

  if (audio.buffered.length > 0) {

    const bufferedAmount = Math.floor(audio.buffered.end(audio.buffered.length - 1));
    const seeked = seekSlider[0].value / seekSlider[0].max * 100;
    const buffered = bufferedAmount / seekSlider[0].max * 100;
    const sliderColor = `linear-gradient(90deg, #82CFD0 0%, #82CFD0 ${seeked}% , #B0B0B0 ${(seeked)}%, #B0B0B0 ${buffered}%, #ffffff ${buffered}%, #ffffff 100%)`;
    seekSlider[0].style.background = sliderColor;
    seekSlider[1].style.background = sliderColor;

  }

  raf = requestAnimationFrame(whilePlaying);
}


// TIME PARSING
const calculateTime = (secs) => {

  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  const returnedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;

  return `${minutes}:${returnedSeconds}`;
}


// DISPLAY AUDIO TOTAL DURATION
const displayDuration = () => {

  durationContainer[0].innerText = calculateTime(audio.duration);
  durationContainer[1].innerText = calculateTime(audio.duration);
}


// IF AUDIO TAG EXIST
if (audio) {
  // AUDIO IS READY TO BE PLAYED
  if (audio.readyState > 0) {

    displayDuration();
    setSliderMax();
  } else {

    // AUDIO LISTEN TO METADATA
    audio.addEventListener('loadedmetadata', () => {

      playIconContainer[0].classList = "fa fa-pause";
      playIconContainer[1].classList = "fa fa-pause play-icon-button text-end d-flex d-md-none";
      playIconContainer[2].classList = "fa fa-pause";

      playState = "play";

      displayDuration();
      setSliderMax();
      whilePlaying();

      // SET SHUFFLE AND REPEAT ICON
      $(".shuffle-container")[0].innerHTML = `<i class="fas fa-random ${(!random) ? "text-muted" : ""}"></i>`;
      $(".repeat-container")[0].innerHTML = `<i class="fas fa-redo ${(!repeat) ? "text-muted" : ""}"></i>`;

      $(".shuffle-container")[1].innerHTML = `<i class="fas fa-random ${(!random) ? "text-muted" : ""}"></i>`;
      $(".repeat-container")[1].innerHTML = `<i class="fas fa-redo ${(!repeat) ? "text-muted" : ""}"></i>`;

      audio.play();
    });
  }


  // AUDIO ON BUFFERS LOAD
  audio.addEventListener("progress", whilePlaying);


  // AUDIO ON PLAY
  audio.addEventListener("play", () => {

    playState = "play";

    seekSlider[0].style.background = "#ffffff";
    seekSlider[1].style.background = "#ffffff";

    playIconContainer[0].classList = "fa fa-pause";
    playIconContainer[1].classList = "fa fa-pause play-icon-button text-end d-flex d-md-none";
    playIconContainer[2].classList = "fa fa-pause";
  });


  // AUDIO ON TIME UPDATE
  audio.addEventListener('timeupdate', () => {
    seekSlider[0].value = Math.floor(audio.currentTime);
    seekSlider[1].value = Math.floor(audio.currentTime);
  });


  // AUDIO ON PAUSE
  audio.addEventListener("pause", () => {

    playState = "pause";

    playIconContainer[0].classList = "fa fa-play";
    playIconContainer[1].classList = "fa fa-play play-icon-button text-end d-flex d-md-none";
    playIconContainer[2].classList = "fa fa-play";

  });


  // AUDIO ON ENDED
  audio.addEventListener("ended", () => {

    if (repeat) {

      audio.currentTime = 0;
      audio.play();

      return;
    }

    $(".fa-fast-forward")[0].click();
  })


  seekSlider.forEach((elem) => {

    // SET INPUT LISTENER TO EACH SEEKSLIDER
    elem.addEventListener('input', (e) => {

      if (currentMusic === undefined) {

        seekSlider[0].value = 0;
        seekSlider[1].value = 0;

        return;
      }

      currentTimeContainer[0].innerText = calculateTime(e.target.value);
      currentTimeContainer[1].innerText = calculateTime(e.target.value);

      audio.currentTime = e.target.value;

      if (!audio.paused) {
        cancelAnimationFrame(rAF);
      }
    });


    // SET CHANGE LISTENER TO EACH SEEKSLIDER
    elem.addEventListener('change', (e) => {

      if (currentMusic === undefined) {

        seekSlider[0].value = 0;
        seekSlider[1].value = 0;

        return;
      }

      audio.currentTime = e.target.value;

      if (!audio.paused) {

        requestAnimationFrame(whilePlaying);
      }
    });
  })


  playIconContainer.forEach((elem) => {

    // PLAY ICON CONTAINER ON CLICK - TOGGLE PAUSE PLAY BUTTON
    elem.addEventListener('click', () => {

      clickedPlay = true;

      if (currentMusic === undefined) {
        return;
      }

      if (playState === 'pause') {

        audio.play();
        requestAnimationFrame(whilePlaying);

        playIconContainer[0].classList = "fa fa-pause";
        playIconContainer[1].classList = "fa fa-pause play-icon-button text-end d-flex d-md-none";
        playIconContainer[2].classList = "fa fa-pause";

        playState = 'play';

      } else {

        audio.pause();

        playIconContainer[0].classList = "fa fa-play";
        playIconContainer[1].classList = "fa fa-play play-icon-button text-end d-flex d-md-none";
        playIconContainer[2].classList = "fa fa-play";

        cancelAnimationFrame(rAF);

        playState = 'pause';
      }
    });
  })
}

// SONG CARD ON HOVER
$(".song-card").mouseenter(function() {
  if(window.matchMedia('(max-width: 767px)').matches){return;}

  this.classList.add("bg-light");

  if (currentMusic === Number(this.getAttribute("value"))) {

    this.querySelector(".play-button").innerHTML = (playState === "play") ? '<i class = "fa fa-pause" aria-hidden></i>' : '<i class = "fa fa-play" aria-hidden></i>';
  } else {

    this.querySelector(".play-button").classList.add("visible");
  }
})

// SONG CARD ON EXIT HOVER
$(".song-card").mouseleave(function() {

  if(window.matchMedia('(max-width: 767px)').matches){return;}


  this.classList.remove("bg-light");

  if (currentMusic === Number(this.getAttribute("value"))) {

    this.querySelector(".play-button").innerHTML = '<lottie-player src="https://assets10.lottiefiles.com/packages/lf20_cWQSb4.json"  background="transparent"  speed="1"  style="width: 24px; height: 24px;"  loop  autoplay></lottie-player>';
    this.querySelector(".play-button").classList.add("visible");
  } else {

    this.querySelector(".play-button").classList.remove("visible");

  }
})


$(".song-card").on("mousedown touchstart",function(){
  position[0]=this.getBoundingClientRect().top;
  position[1]=this.getBoundingClientRect().left;


  const index = Number(this.getAttribute("value"));
  if (currentMusic !== index) {
    this.classList.add("bg-light");
  }
})

$(".song-card").on("mouseup touchend",function(){
  const curPosition = [this.getBoundingClientRect().top,this.getBoundingClientRect().left];

  this.classList.remove("bg-light");


  if((curPosition[0] === position[0]) && (curPosition[1] === position[1])){

    const index = Number(this.getAttribute("value"));

    if (currentMusic !== index) {
      $(".song-card .play-button")[index].click();
    }

  }
})

// TOGGLE "RANDOM" STATE
$(document).on("click", ".fa-random", function() {

  $(".fa-random")[0].classList.toggle("text-muted");
  $(".fa-random")[1].classList.toggle("text-muted");

  random = !this.classList.contains("text-muted");

  if (random) {

    shuffleMusic();
  }
})


// TOGGLE "REPEAT" STATE
$(document).on("click", ".fa-redo", function() {

  $(".fa-redo")[0].classList.toggle("text-muted");
  $(".fa-redo")[1].classList.toggle("text-muted");

  repeat = !this.classList.contains("text-muted");

})


// FAST-FOWARD ON CLICK
$(".fa-fast-forward").click(function() {

  if (currentMusic === undefined) {
    return;
  }

  if (repeat) {

    audio.currentTime = 0;
    audio.play();

    return;
  }

  const songCardList = document.querySelectorAll(".song-card");

  if (random) {

    shuffleIndex = (shuffleIndex + 1 < shuffleOrder.length) ? shuffleIndex + 1 : 0;

    const nextMusicIndex = shuffleOrder[shuffleIndex];
    songCardList[nextMusicIndex].querySelector(".play-button").click();

  } else {

    songCardList[(currentMusic + 1 < songCardList.length) ? currentMusic + 1 : 0].querySelector(".play-button").click();

  }
})


// FAST BACKWARD ON CLICK
$(".fa-fast-backward").click(function() {

  if (currentMusic === undefined) {
    return;
  }

  const songCardList = document.querySelectorAll(".song-card");
  const playedPart = (audio.currentTime / audio.duration) * 100;

  // PLAYED 10% OF THE DURATION
  if (playedPart > 10) {

    audio.currentTime = 0;
    audio.play();

    return;
  }


  if (repeat) {

    audio.currentTime = 0;
    audio.play();

    return;
  }

  if (random) {

    shuffleIndex = (shuffleIndex - 1 > 0) ? shuffleIndex - 1 : shuffleOrder.length - 1;
    const nextMusicIndex = shuffleOrder[shuffleIndex];

    songCardList[nextMusicIndex].querySelector(".play-button").click();
  } else {

    songCardList[(currentMusic - 1 >= 0) ? currentMusic - 1 : 0].querySelector(".play-button").click();
  }
})


// SONG CARD'S PLAY-BUTTON ON CLICK - LOAD MUSIC TO AUDIO CONTROLLER
$(".play-button").click(function() {

  const filename = $(this).val();
  const url = `${protocol}//${baseUrl}/music/file/${filename}`;
  const songCard = $(this).closest(".song-card")[0];
  const title = songCard.querySelector(".song-title").innerText;
  const singer = songCard.querySelector(".song-singer").innerText;
  const index = Number(songCard.getAttribute("value"));
  const likedButton = songCard.querySelector(".fa-heart");


  if (currentMusic === undefined) {
    $(".audio-controller").slideToggle();
  }

  if (currentMusic === index) {

    if (playState === 'pause') {

      audio.play();
      requestAnimationFrame(whilePlaying);

      playIconContainer[0].classList = "fa fa-pause";
      playIconContainer[1].classList = "fa fa-pause play-icon-button text-end d-flex d-md-none";
      playIconContainer[2].classList = "fa fa-pause";

      this.innerHTML = (window.matchMedia('(max-width: 767px)')) ? '<lottie-player src="https://assets10.lottiefiles.com/packages/lf20_cWQSb4.json"  background="transparent"  speed="1"  style="width: 24px; height: 24px;"  loop  autoplay></lottie-player>' :'<i class = "fa fa-pause" aria-hidden></i>';
      playState = 'play';

    } else {

      audio.pause();

      playIconContainer[0].classList = "fa fa-play";
      playIconContainer[1].classList = "fa fa-play play-icon-button text-end d-flex d-md-none";
      playIconContainer[2].classList = "fa fa-play";

      this.innerHTML = '<i class = "fa fa-play" aria-hidden></i>'

      cancelAnimationFrame(rAF);
      playState = 'pause';

    }

    return;

  } else {

    if (currentMusic != undefined) {

      $(".play-button")[currentMusic].innerHTML = '<i class = "fa fa-play" aria-hidden></i>';
      $(".play-button")[currentMusic].classList.remove("visible");

    }

  }

  seekSlider[0].style.background = "#ffffff";
  seekSlider[1].style.background = "#ffffff";


  currentMusic = index;

  this.innerHTML = '<lottie-player src="https://assets10.lottiefiles.com/packages/lf20_cWQSb4.json"  background="transparent"  speed="1"  style="width: 24px; height: 24px;"  loop  autoplay></lottie-player>';
  this.classList.add("visible");

  if (window.location.pathname !== "/admin") {

    if (likedButton.classList.contains("liked")) {

      $(".liked-button-container")[0].innerHTML = '<i name= "musicId" value="' + likedButton.getAttribute("value") + '" class="fa fa-heart liked" aria-hidden="true"></i>';
      $(".liked-button-container")[1].innerHTML = '<i name= "musicId" value="' + likedButton.getAttribute("value") + '" class="fa fa-heart liked" aria-hidden="true"></i>';

    } else {

      $(".liked-button-container")[0].innerHTML = '<i name= "musicId" value="' + likedButton.getAttribute("value") + '" class="fa fa-heart" aria-hidden="true"></i>'
      $(".liked-button-container")[1].innerHTML = '<i name= "musicId" value="' + likedButton.getAttribute("value") + '" class="fa fa-heart" aria-hidden="true"></i>'

    }
  }

  $(".current-music-title").text(title);
  $(".current-music-singer").text(singer);
  $(".current-music-picture").html('<img class="w-100" src="song.jpg" alt="...">');

  audio.setAttribute("src", url);

});


// AUDIO CONTROLLER ON CLICK - ONLY TRIGGERED IF USER USES PHONE
$(audioController).click(function() {
  if (window.matchMedia('(max-width: 767px)').matches && !$(".audio-controllers-modals")[0].classList.contains("expand") && !clickedPlay) {
    $(".audio-controllers-modals")[0].classList.toggle("expand");
  }
  clickedPlay = false;
})


// EXIT BUTTON ON CLICK - CLOSES PHONE MODALS
$(".exit").click(function() {
  $(".audio-controllers-modals")[0].classList.toggle("expand");
})


// PASSWORD ICON ON CLICK - REVEALS PASSWORD IN PLAIN TEXT
$('.password i').on('click', function() {

  if ($('.password input').attr('type') === 'password') {

    $('.password input').attr('type', 'text');
    $('.password i').removeClass('fa-eye-slash').addClass('fa-eye');

  } else {

    $('.password input').attr('type', 'password');
    $('.password i').removeClass('fa-eye').addClass('fa-eye-slash');

  }
});


// PIN BOX INPUT FILTER
$(".pinBox").on("keyup", function(e) {

  var key = String(e.key);
  var curVal = $(this).val();

  if (patt.test(key) && key.length === 1) {} else {
    return;
  }

  var id = Number($(this).attr("id").substr(4, 5));

  $(this).val(key);

  var pinBoxes = $(".pinBox");

  if (id === pinBoxes.length) {
    pinBoxes[id - 1].blur();
    return;
  }

  pinBoxes[id].focus();

});


// EDIT BUTTON ON CLICK
$(".edit-button").click(function(e) {

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


// EDIT SONG'S FILE ON CHANGE (INPUTS) - CHANGE FORM'S ACTION & FORMAT
$("#edit-song-upload").on("change", function() {

  const temp = this.form.getAttribute("action");
  const url = temp.replace("without-file/", "");

  this.form.setAttribute("enctype", "multipart/form-data");
  $(".edit-form")[0].querySelector("form").setAttribute("action", url);

});


// DELETE BUTTON ON ADMIN PAGE
$(".deleteButton").click(async function(e) {

  const musicId = $(this).val();
  $(this).attr("disabled", true);

  const agreeToDelete = confirm("Are you sure you want to delete this music? Once you delete it, it will no longer exist");

  if (!agreeToDelete) {
    $(this).attr("disabled", false);
    return;
  }

  const response = await fetch(`${protocol}//${baseUrl}/music/delete/${musicId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const temp = await response.json();


  var row = $(this).closest('tr');
  row.addClass("bg-light");
  row.hide(1500, function() {
    this.remove();
  });

});


// ADD ALL MUTE ICON'S CLICK LISTENER
muteIcon.forEach((elem) => {
  elem.addEventListener("click", function(e) {

    const temp = e.target;

    if (temp.classList.contains("fa-volume-up")) {

      muteIcon[0].firstElementChild.classList.remove("fa-volume-up");
      muteIcon[1].firstElementChild.classList.remove("fa-volume-up");

      muteIcon[0].firstElementChild.classList.add("fa-volume-mute");
      muteIcon[1].firstElementChild.classList.add("fa-volume-mute");

      $(volumeSlider[0]).val(0);
      $(volumeSlider[1]).val(0);

      $(outputContainer[0]).text(0);
      $(outputContainer[1]).text(0);

      audio.volume = 0;

    } else if (temp.classList.contains("fa-volume-mute")) {

      muteIcon[0].firstElementChild.classList.remove("fa-volume-mute");
      muteIcon[1].firstElementChild.classList.remove("fa-volume-mute");

      muteIcon[0].firstElementChild.classList.add("fa-volume-up");
      muteIcon[1].firstElementChild.classList.add("fa-volume-up");

      $(volumeSlider[0]).val(currentVolume);
      $(volumeSlider[1]).val(currentVolume);

      $(outputContainer[0]).text(currentVolume);
      $(outputContainer[1]).text(currentVolume);

      audio.volume = currentVolume / 100;

    }
  })
})


// ADD ALL VOLUMESLIDER'S CHANGE AND INPUT LISTENER
volumeSlider.forEach((elem) => {

  // VOLUME SLIDER ON CHANGE
  elem.addEventListener("change", function(e) {

    const value = e.target.value;

    if (value !== 0) {
      currentVolume = value;
    }

  });

  // VOLUME SLIDER ON INPUT
  elem.addEventListener("input", function(e) {

    const value = Number(e.target.value);

    if (value === 0) {

      muteIcon[0].click();
      muteIcon[1].click();

    } else {

      const temp = muteIcon;

      if (temp[0].firstElementChild.classList.contains("fa-volume-mute")) {

        temp[0].firstElementChild.classList.remove("fa-volume-mute");
        temp[0].firstElementChild.classList.add("fa-volume-up");
        $(volumeSlider[0]).val(value);
        $(outputContainer[0]).text(value);

      }

      if (temp[1].firstElementChild.classList.contains("fa-volume-mute")) {

        temp[1].firstElementChild.classList.remove("fa-volume-mute");
        temp[1].firstElementChild.classList.add("fa-volume-up");
        $(volumeSlider[1]).val(value);
        $(outputContainer[1]).text(value);

      }
    }

    $(outputContainer[0]).text(value);
    $(outputContainer[1]).text(value);

    audio.volume = value / 100;

  })
})


// LIKE BUTTON MOUSE DOWN
$(document).on("mousedown", ".fa-heart", function() {
  this.classList.add("enlarge");
})


// LIKE BUTTON MOUSE UP
$(document).on("mouseup", ".fa-heart", async function() {

  this.classList.remove("enlarge");
  this.classList.toggle("liked");

  const musicId = this.getAttribute("value");
  const data = {musicId};

  if (this.parentNode.classList[0] === "card-text") {

    $(".liked-button-container")[0].classList.toggle("liked");

    if (window.location.pathname === "/profile") {

      $($(this).closest(".song-card")).addClass("bg-light");
      $($(this).closest(".song-card")).hide(1500, function() {
        if ($(this).closest(".col-md-6").children().length === 2) {
          $(this).closest(".col-md-6").append("<h5>No song available :(</h5>");
        };
        this.remove();

      })
    }

  } else {

    if (currentMusic !== undefined) {
      $(".song-card")[currentMusic].querySelector(".fa-heart").classList.toggle("liked");

    }

  }

  const response = await fetch(`${protocol}//${baseUrl}/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });


  if (response.url === `${protocol}//${baseUrl}/login`) {
    return window.location.href = `${protocol}//${baseUrl}/login`;
  }

  const temp = await response.json();
})

$(document).ready(function(){
  if(isIOSDevice()){
    $(".output-container")[0].classList.add("d-none");
    $(".output-container")[1].classList.add("d-none");
  }

  if (window.location.pathname === "/profile") {
    $(".audio-controller .liked-button-container").addClass("invisible");
    $(".audio-controllers-modals .liked-button-container").addClass("invisible");
  }
})
