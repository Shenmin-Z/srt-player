<p align="center">
  <img src="https://github.com/Shenmin-Z/srt-player/raw/master/public/srt-player.svg" width="120" alt="wstunnel logo"/>
</p>

# SRT Player

Video player that displays subtitle by the side

[Try it here](https://shenmin-z.github.io/srt-player/)

Screenshot on android Chrome

![screenshot](./docs/screenshot.jpg)

Video demo: [youtube](https://youtu.be/UpgwD5ejwMo), [哔哩哔哩](https://www.bilibili.com/video/BV1Ci4y1d7iA/)

## Usage

- prepare video and subtitle files
- click on the 'upload' button or drag and drop files

## Features

### Subtitle

- scrollable and selectable
- adjust delay in a breeze (`click` on start or end time that is above individual subtitle text)

### Waveform

- find the exact location to replay (`click` to set replay position)

### Offline usable

- onced loaded, can be used without internet next time

## About "upload"

This application plays local video, it's not real "upload". This causes the problem that a user will have to "upload" everytime after the web page is reloaded. To mitigate this problem you can:

- use desktop Chrome or Edge, which supports reading local files(user permission required)
- check the `Copy file(s) to cache` option when uploading, which will save video files to indexeddb

## Limitations

- Modern browser required. Tested on Chrome, Firefox, Edge and desktop Safari.
- Video has to be in codecs that browser can play, which means if your video file has an incompatible format you will have to convert it to a compatible one first.
- Waveform generation might not be accurate or fail on large file, in which case you can extract audio from video with some other software and select the `Enable using extra audio file` option.
