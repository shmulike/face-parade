# Face-Lapse

**From Shmulik Creations**

## Purpose

Face-Lapse is a privacy-first, browser-based face alignment and video montage tool. It processes your photos **entirely on your machine**—no uploads, no cloud processing, no data collection. Perfect for creating smooth face morph videos, time-lapse sequences, or simply organizing photos by facial landmarks.

## What It Does

Transform a folder of photos into a professionally aligned video montage:

1. **Load Images**: Select a folder containing photos of faces
2. **Auto-Analyze**: AI-powered face detection identifies 478 facial landmarks per image
3. **Smart Alignment**: Automatically aligns all faces to create smooth transitions
4. **Customize**: Adjust resolution, frame rate, exclude specific images, overlay landmarks
5. **Export**: Generate MP4, AVI, or WebM videos with your aligned sequence

## Key Features

- **100% Local Processing**: All computation happens in your browser. Your photos never leave your device.
- **Advanced Face Mesh**: Uses MediaPipe's 478-point face landmark detection for precise alignment
- **Drag & Drop Reordering**: Manually adjust the sequence order with intuitive drag-and-drop
- **Flexible Export Options**: Multiple resolutions (1080p, 720p, square), formats (MP4, AVI, WebM), and frame rates
- **Quality Control**: Automatically flags images with no faces, multiple faces, or low confidence
- **Landmark Overlay**: Optionally visualize all 478 facial landmarks in your output video

## Technology Stack

- **Next.js 15** - React framework with App Router
- **MediaPipe Face Landmarker** - Google's ML model for facial landmark detection
- **Sharp** - High-performance image processing
- **FFmpeg** - Professional video encoding
- **TypeScript** - Type-safe development

## Privacy & Security

Face-Lapse is designed with privacy as the top priority:

- No server uploads—all processing is local
- No analytics or tracking
- No data storage on external servers
- Your images stay on your machine

## Use Cases

- **Personal Projects**: Create face morph videos, aging timelapses, transformation sequences
- **Photography**: Align portrait series for consistent framing
- **Research**: Generate facial landmark visualizations for academic or technical work
- **Creative Content**: Produce engaging social media content

## Getting Started

1. Clone this repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)
5. Load a folder of images and start creating!

## License & Disclaimer

Copyright © 2026 Shmulik Creations. All rights reserved.

This software is provided "as is" without warranty of any kind. See the footer of the application for full terms and conditions.

---

**Made with ❤️ by Shmulik Creations**
