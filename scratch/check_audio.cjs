const fs = require('fs');

function getMp3Duration(filePath) {
  const buffer = fs.readFileSync(filePath);
  // Scan for MPEG frames
  let offset = 0;
  let totalDuration = 0;
  let frameCount = 0;
  
  // Skip ID3v2 tag
  if (buffer.toString('ascii', 0, 3) === 'ID3') {
    const size = ((buffer[6] & 0x7f) << 21) |
                 ((buffer[7] & 0x7f) << 14) |
                 ((buffer[8] & 0x7f) << 7) |
                 (buffer[9] & 0x7f);
    offset = 10 + size;
  }

  const bitrates = [
    0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0
  ];
  const sampleRates = [44100, 48000, 32000, 0];

  while (offset < buffer.length - 4) {
    if (buffer[offset] === 0xff && (buffer[offset + 1] & 0xe0) === 0xe0) {
      const b1 = buffer[offset + 1];
      const b2 = buffer[offset + 2];
      const version = (b1 >> 3) & 3; // 3 = MPEG 1
      const layer = (b1 >> 1) & 3;   // 1 = Layer III
      const bitrateIdx = (b2 >> 4) & 0x0f;
      const sampleRateIdx = (b2 >> 2) & 3;
      const padding = (b2 >> 1) & 1;

      if (version === 3 && layer === 1 && bitrateIdx > 0 && bitrateIdx < 15 && sampleRateIdx < 3) {
        const bitrate = bitrates[bitrateIdx] * 1000;
        const sampleRate = sampleRates[sampleRateIdx];
        const frameLength = Math.floor((144 * bitrate) / sampleRate) + padding;
        totalDuration += 1152 / sampleRate;
        frameCount++;
        offset += frameLength;
        continue;
      }
    }
    offset++;
  }
  return { frameCount, totalDuration };
}

console.log('japanese_intro.mp3:', getMp3Duration('public/audio/japanese_intro.mp3'));
console.log('teleport_hanzo.mp3:', getMp3Duration('public/audio/teleport_hanzo.mp3'));
