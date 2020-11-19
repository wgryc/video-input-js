# videoinput.js: client-side video input field with POST submissions

Video inputs can be a pain. This JS file creates a new HTML element that enables you to record video inputs and POST them directly to a URL. It is meant to act as a simple form-like interface for recording and submitting videos.

Currently this works on Firefox and Chrome. It does not require jQuery.

[See a demo here.](https://phaseai.com/resources/video-input-form-js-demo)

## Sample Code

This is meant to be as simple as possible. Below is a sample video input:
```
<video-input id="vid1" width="640" height=480" label="Please record your answer below." labelloc="top" action="/r/upload" maxtime="3"></video-input>
```

This will create a video input field 640px wide and 480px high, with the label "Please record your answer" above the video input. The field will enable you record for 3 seconds, and clicking "submit" will send the video to /r/upload.

## Supported Attributes

*Required* fields are below:
* id: the id of the element. Also used to name files and reference buttons within the field.
* label: the instructions above or below the video input field.
* action: the URL where the post request will be sent.

*Optional* fields are below:
* vidwidth: video width in pixels
* vidheight: video height in pixels
* labelloc: the location of the label field. Use "top" or "bottom" to position the label.
* maxtime: the maximum length of the recording in seconds.

## About

This project is written by Wojciech Gryc at [Phase AI](https://phaseai.com/). We're a team dedicated to making it easier to find technical roles and communicate your ability to succeed in those roles. If you have questions, please reach out at hello <at> phaseai <dot> com.
