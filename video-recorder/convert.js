const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegPath);

const videoDir = path.join(__dirname, '..', 'demo-video');
const files = fs.readdirSync(videoDir).filter(f => f.endsWith('.webm'));

if (!files.length) { console.error('No .webm file found'); process.exit(1); }

const input = path.join(videoDir, files[0]);
const output = path.join(videoDir, 'tokenestate-demo.mp4');

console.log('Converting:', files[0], '→ tokenestate-demo.mp4');

ffmpeg(input)
  .videoCodec('libx264')
  .audioCodec('aac')
  .outputOptions(['-pix_fmt yuv420p', '-movflags +faststart', '-crf 23'])
  .output(output)
  .on('progress', p => process.stdout.write(`\rProgress: ${Math.round(p.percent || 0)}%`))
  .on('end', () => {
    const size = (fs.statSync(output).size / 1024 / 1024).toFixed(2);
    console.log(`\nDone! tokenestate-demo.mp4 (${size} MB)`);
    console.log('Location:', output);
  })
  .on('error', e => console.error('Error:', e.message))
  .run();
