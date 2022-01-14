<p align="center">
  <img src="https://github.com/Shenmin-Z/srt-player/raw/master/public/srt-player.svg" width="120" alt="wstunnel logo"/>
</p>

# SRT Player - Video and subtitle side by side

[https://shenmin-z.github.io/srt-player/](https://shenmin-z.github.io/srt-player/)

![screenshot](./docs/screenshot.png)

Video demo: [youtube](https://youtu.be/UpgwD5ejwMo), [Bilibili](https://www.bilibili.com/video/BV1Ci4y1d7iA/)

### What's wrong with normal video player?

Nothing is wrong, it's just that in certain situations, you want to:

- see the full context
- copy & paste subtitle content
- adjust subtitle delay
- pinpoint in the timeline and replay from that place

With normal video players it may not be very convenient to do these.

## Features

### Subtitle

- scrollable and selectable
- adjust delay in a breeze (`click` on start or end time that is above individual subtitle text)

### Waveform

- find the exact location to replay (`click` to set replay position, which is indicated by a vertical yellow line, and press `r` to play at that position)

### Offline usable

- onced loaded, can be used without internet next time

## Limitations

- Video has to be in codecs that browser can play, which means if your video file has an incompatible format you will have to convert it to a compatible one first
- Waveform generation might not be accurate or fail on large file, in which case you can extract audio from video with some other software and select the `Enable using extra audio file` option
