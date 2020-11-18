/*************************************************************
*  Copyright, 2020 by Wojciech Gryc from Phase AI.
*  Learn more at https://phaseai.com/
*
*  This code is licensed under the MIT license. Please visit
*  <<github>> for source code, license info, documentation,
*  and more.
*
*  VERSION:       0.1.0
*  LAST UPDATED:  18 November 2020
*
*  ACKNOWLEDGEMENTS
*
*  A special "thank you" goes out to the authors of the
*  WebRTC protocols and framework. Much of this code is
*  influenced by their work. Learn more here:
*  https://webrtc.org/
*
*  For the specific project this is based on, check this
*  sample out:
*  https://webrtc.github.io/samples/src/content/getusermedia/record/
*
*************************************************************/

'use strict';

let mediaRecorder; // Global variable for the recording object.
let recordedBlobs; // Global variable for the active recording.

/*************************************************************
*  Code used for tracking the timing of video elements.
*************************************************************/

/*
*  Variables used to track recording as it takes place. This
*  is used mainly for the countdown timer.
*/
var timerid;           // ID of the video elememnt being timed.
var timercount;        // Counter (seconds elapsed).
var timermaxtime;      // Max number of seconds allowed for video.
var intervaltracker;   // Interval tracker so that we can disable it later.

function timerstep() {
   /* Timer step. This tracks every second that a video is recording
   *  and updates the visual interface, labels, etc. accordingly.
   */

   timercount += 1;

   let timeleft = timermaxtime - timercount;
   let timerlabelobj = document.querySelector("#" + timerid + "timerlabel")
   timerlabelobj.innerHTML = "Time left: " + timeleft + " seconds"

   if (timercount > timermaxtime) {
      // Stop recording once the time limit is hit.
      clearInterval(intervaltracker)
      stopRecording(timerid);
      timerlabelobj.innerHTML = "Recording complete!"

      // Clear out the timer info for the next run.
      timercount = 0;
      timerid = null;
   }
}

/*************************************************************
*  Code used for tracking the timing of video elements.
*************************************************************/

async function stopAll() {
   /*
    *  Stop all recording (audio, video) tracks.
    */
   window.stream.getTracks().forEach(function(track) { track.stop(); });
}

async function playRec(objid) {
   /*
    *  Plays the recording back to the user.
    */
  let gvobj = document.querySelector("#" + objid);
  const superBuffer = new Blob(gvobj.getAllBlobs(), {type: 'video/webm'});
  let gumVideo = document.querySelector("#gum" + objid);
  gumVideo.src = null;
  gumVideo.srcObject = null;
  gumVideo.src = window.URL.createObjectURL(superBuffer);
  gumVideo.controls = true;
  gumVideo.play();
}

function recordme(videoinputid) {
   /*
    *  Starts/stops the recording depending on the value of the "record" button.
    */
    let gvbutton = document.querySelector("#" + videoinputid + "recordbutton")
    if (gvbutton.innerHTML === "Record") {
        let gv = document.querySelector("#" + videoinputid)
        gv.initializeRecording()
        gvbutton.innerHTML = "Stop"
    } else {
        stopRecording(videoinputid);
    }
}

function handleDataAvailable(event) {
   /*
    *  Saves the recording data (event) stream to an array. This is the
    *  raw recording data.
    */
  console.log('handleDataAvailable', event);
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function startRecording() {
   /*
    *  Starts the recording.
    */
  recordedBlobs = [];
  let options = {mimeType: 'video/webm;codecs=vp9,opus'};
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    console.error(`${options.mimeType} is not supported`);
    options = {mimeType: 'video/webm;codecs=vp8,opus'};
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.error(`${options.mimeType} is not supported`);
      options = {mimeType: 'video/webm'};
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not supported`);
        options = {mimeType: ''};
      }
    }
  }

  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    return;
  }

  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);

  mediaRecorder.onstop = (event) => {
    console.log('Recorder stopped: ', event);
    console.log('Recorded Blobs: ', recordedBlobs);
  };
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start();
  console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording(objid) {
   /*
    *  Stops the recording.
    */
  mediaRecorder.stop();
  const blob = new Blob(recordedBlobs, {type: 'video/webm'});
  console.log("#" + objid)
  let gvobj = document.querySelector("#" + objid);
  gvobj.saveBlob(blob);
  gvobj.saveBlobArrays(recordedBlobs);

  stopAll();
  let gvbutton = document.querySelector("#" + objid + "recordbutton")
  gvbutton.innerHTML = "Record"

  // Resets the timer, assuming the timer the was being used.
  let timerlabelobj = document.querySelector("#" + timerid + "timerlabel")
  clearInterval(intervaltracker)
  gvobj.resetTimerLabel()

  // Updates the buttons -- they become enabled once a recording has been completed.
  let gvbutton1 = document.querySelector("#" + objid + "download")
  let gvbutton2 = document.querySelector("#" + objid + "play")
  let gvbutton3 = document.querySelector("#" + objid + "submit")

  gvbutton1.disabled = false;
  gvbutton2.disabled = false;
  gvbutton3.disabled = false;

}

function handleSuccess(stream, objid) {
   /*
    *  Starts the recording *if* the video stream has been successfully enabled.
    */
  console.log('getUserMedia() got stream:', stream);
  window.stream = stream;

  console.log(objid)
  let gumVideo = document.querySelector(objid);
  gumVideo.srcObject = stream;
  startRecording()
}

async function init(constraints) {
   /*
    *  Initialize the video stream. If it's successful, see handleSuccess().
    */
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
  } catch (e) {
    console.error('navigator.getUserMedia error:', e);
  }
}

function getConstraints(vWidth, vHeight) {
   /*
    *  Video settings.
    */
   let constraints = {
    audio: {
      echoCancellation: {exact: false}
    },
    video: {
      width: vWidth, height: vHeight
    }
  };
  return constraints
}

async function submitfile(objid) {
   /*
    *  Function to call the relevant video-input object and submit a file
    *  for upload.
    */
  let gvobj = document.querySelector("#" + objid);
  gvobj.submit()
}

function deleteRecording(videoinputid) {
   /*
    *  Clears the recording from memory. Currently not being used.
    */
   let gv = document.querySelector("#" + videoinputid)
   gv.deleteRecording()
}

async function downloadfile(videoinputid) {
   /*
    *  Function to call the relevant video-input object and download
    *  the video file.
    */
   let gvobj = document.querySelector("#" + videoinputid)
   gvobj.downloadblob();
}

/*************************************************************
*  Class for the <video-input> element!
*************************************************************/

class VideoInput extends HTMLElement {

  constructor() {
    /*
     *  Constructor! Default values!
     */
    super();
    this._isRecording = false;
    this._mediablob = [];
    this._allblobs = []
    this._width = 640;
    this._height = 480;
    this._labelloc = "bottom";
    this._label = "";
    this._posturl = "";
    this._maxtime = 0;
    this._timercounter = 0;
    this._interval = 0;
  }

  static get observedAttributes() { return ["width", "height", "labelloc", "label", "action", "maxtime"]; }

  attributeChangedCallback(name, oldValue, newValue) {
      /*
       *  Saves attributes.
       */
      if (name === "width") {
          this._width = newValue;
      } else if (name === "height") {
          this._height = newValue;
      } else if (name === "labelloc") {
          if (newValue === "top" | newValue === "bottom" | newValue === "hidden") {
              this._labelloc = newValue;
          }
      } else if (name === "label") {
          this._label = newValue;
      } else if (name === "action") {
          this._posturl = newValue;
      } else if (name === "maxtime") {
          this._maxtime = newValue;
      }
      this._updateRendering();
  }

  startTimer() {
    /*
     *  Starts the timer *if* we are giving videos a time limit.
     */
    if (this._maxtime > 0) {
        timerid = this.id
        timercount = 0;
        timermaxtime = this._maxtime;
        intervaltracker = setInterval(timerstep, 1000);
    }
  }

  resetTimerLabel() {
    /*
     *  Resets the timer label. This gets called when we complete a recording.
     */
    this._updateRendering()
  }

  connectedCallback() {
    this._updateRendering();
  }

  updateLabel(labeltext) {
    /*
     *  Updates the label above/below the video field.
     */
    let gvlabel = document.querySelector("#" + this.id + "label");
    gvlabel.innerHTML = labeltext;
  }

  async submit() {
    /*
     *  Submits the video as a POST request. Note that buttons become disabled
     *  when this happens as the form has effectively been submitted, albeit
     *  asynchronously.
     */

    // Disables buttons; commented out disabling "download" based on user feedback.

    //let gvbutton1 = document.querySelector("#" + this.id + "download")
    let gvbutton2 = document.querySelector("#" + this.id + "play")
    let gvbutton3 = document.querySelector("#" + this.id + "submit")
    let gvbutton4 = document.querySelector("#" + this.id + "recordbutton")

    //gvbutton1.disabled = true;
    gvbutton2.disabled = true;
    gvbutton3.disabled = true;
    gvbutton4.disabled = true;

    // Creates a FormData objects and includes the file name (based on the
    // video-input element's ID) and adds the recording as a file.
    var fd = new FormData();
    const blob = new Blob(this._allblobs, {type: 'video/webm'});
    fd.append('fname', this.id + '.webm');
    fd.append('data', blob);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', this._posturl);
    xhr.send(fd);

    // Updates the form field to say we're uploading the file.
    this.updateLabel("<span style='color:red;'>Uploading response... This can take a few minutes.</span>");

    // Once the file is uplaoded, we update the label.
    xhr.onload = () => {
        console.log(xhr.responseText);
        this.updateLabel("<span style='color:red;'>Upload complete! Thank you.</span>")

    }

  }

  async initializeRecording() {
    /*
     *  Initialize the recording.
     */
    try {
      let constraints = getConstraints(this._width, this._height);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      handleSuccess(stream, "#gum" + this.id);
      this.isRecording = true;
      this.startTimer();
    } catch (e) {
      console.error('navigator.getUserMedia error:', e);
    }
  }

  saveBlob(blob) {
    /*
     *  Saves the recording from the global scope to the element itself.
     */
    this._mediablob = blob;
  }

  saveBlobArrays(blobs) {
    /*
     *  Saves the recording from the global scope to the element itself.
     */
    this._allblobs = blobs;
  }

  async downloadblob() {
    /*
     *  Enables you to download the blob as a "webm" file.
     */
   const blob = new Blob(this._allblobs, {type: 'video/webm'});
   const url = window.URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.style.display = 'none';
   a.href = url;
   a.download = this.id + '.webm';
   document.body.appendChild(a);
   a.click();
   setTimeout(() => {
     document.body.removeChild(a);
     window.URL.revokeObjectURL(url);
   }, 100);
  }

  getBlob() {
    /*
     *  Access the blob.
     */
    return this._mediablob;
  }

  getAllBlobs() {
    /*
     *  Access the blobs.
     */
    return this._allblobs;
  }

  deleteRecording() {
    /*
     *  Clears the blobs from memory. We don't currently use this.
     */
    this._mediablob = [];
    this._allblobs = [];
    playRec(this.id);
  }

  _updateRendering() {
    let innhtml = "<video style='width:" + this._width + "px;height:" + this._height + "px;' id='gum" + this.id + "' playsinline autoplay></video><br/>";

    let form_field_label = "<span id='" + this.id + "label'>" + this._label + "</span>"
    if (this._maxtime > 0) {
        form_field_label += "<br/><span id='" + this.id + "timerlabel'>Max Time: " + this._maxtime + " seconds</span>";
    }

    let button_row = "<button id='" + this.id + "recordbutton' onclick='javascript:recordme(\"" + this.id + "\");'>Record</button><button id='" + this.id + "play' onclick='javascript:playRec(\"" + this.id + "\");' disabled>Play</button><button id='" + this.id + "download' onclick='javascript:downloadfile(\"" + this.id + "\");' disabled>Download</button><button id='" + this.id + "submit' onclick='javascript:submitfile(\"" + this.id + "\");' disabled>Submit</button>"

    if (this._labelloc !== "hidden") {
        if (this._labelloc === "top") {
            innhtml = "<div class='videofieldlabel' style='width:" + this._width + "px;'>" + form_field_label + "<br/>" + button_row + "</div>" + innhtml
        } else {
            innhtml = innhtml + "<div class='videofieldlabel' style='width:" + this._width + "px;'>" + form_field_label + "<br/>" + button_row + "</div>"
        }
    }

    this.innerHTML = innhtml;

  }
}

customElements.define('video-input', VideoInput);
