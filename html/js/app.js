
//webkitURL is deprecated but nevertheless 
URL = window.URL || window.webkitURL;

var gumStream;
//stream from getUserMedia() 
var rec;
//Recorder.js object 
var input;
//MediaStreamAudioSourceNode we'll be recording 
// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContext();
//new audio context to help us record 
var playButton = document.getElementById("sendButton");
var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var pauseButton = document.getElementById("pauseButton");
//add events to those 3 buttons 
playButton.addEventListener("click",startplayingChrip);
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
pauseButton.addEventListener("click", pauseRecording);



/* We're using the standard promise based getUserMedia()

https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia */
function startplayingChrip(){
    
    var audio = new Audio('audio/sine_logarithmic_15000_to_20000_sr_44100_30s.wav');
    alert(audio.duration);
    audio.play();
    startRecording();
    if (audio.ended){
        stopRecording();
    }
}

function startRecording() { 
   
console.log("recordButton clicked"); 


var constraints = {audio: true,video: false};
/* Disable the record button until we get a success or fail from getUserMedia() */

recordButton.disabled = true;
stopButton.disabled = false;
pauseButton.disabled = false;


navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    try{
        gumStream = stream;
        /* use the stream */
        input = audioContext.createMediaStreamSource(stream);
        /* Create the Recorder object and configure to record mono sound (1 channel)*/
        rec = new Recorder(input, {numChannels: 1}); 
        //start the recording process 
        rec.record();
    }
    catch(err){
        recordButton.disabled = false;
        stopButton.disabled = true;
        pauseButton.disabled = true;

    }
});

}


function pauseRecording() {
    
    if (rec.recording) {
        //pause 
        rec.stop();
        pauseButton.innerHTML = "Resume";
    } else {
        //resume 
        rec.record();
        pauseButton.innerHTML = "Pause";
    }
}

function stopRecording() {
    
    //disable the stop button, enable the record too allow for new recordings 
    stopButton.disabled = true;
    recordButton.disabled = false;
    pauseButton.disabled = true;
    //reset button just in case the recording is stopped while paused 
    pauseButton.innerHTML = "Pause";
    //tell the recorder to stop the recording 
    rec.stop(); //stop microphone access 
    gumStream.getAudioTracks()[0].stop();
    //create the wav blob and pass it on to createDownloadLink 
    rec.exportWAV(createDownloadLink);
}



/* server side for uploading*/
function createDownloadLink(blob) {
    var url = URL.createObjectURL(blob);
    var au = document.createElement('audio');
    var li = document.createElement('li');
    var link = document.createElement('a');
    //add controls to the <audio> element 
    au.controls = true;
    au.src = url;
    //link the a element to the blob 
    link.href = url;
    link.download = new Date().toISOString() + '.wav';
    link.innerHTML = link.download;
    //add the new audio and a elements to the li element 
    li.appendChild(au);
    li.appendChild(link);
    //add the li element to the ordered list 
    recordingsList.appendChild(li);

    var filename = new Date().toISOString();
    //filename to send to server without extension 
    //upload link 
    var upload = document.createElement('a');
    upload.href = "#"; // need to set later 
    upload.innerHTML = "Upload";
    upload.addEventListener("click", function(event) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function(e) {
            if (this.readyState === 4) {
                console.log("Server returned: ", e.target.responseText);
            }
        };
        var fd = new FormData();
        fd.append("audio_data", blob, filename);
        xhr.open("POST", "upload.php", true);
        xhr.send(fd);
    })
    li.appendChild(document.createTextNode(" ")); //add a space in between 
    li.appendChild(upload); //add the upload link to li

}

