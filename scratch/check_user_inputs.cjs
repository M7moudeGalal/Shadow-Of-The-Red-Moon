const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream('C:/Users/modeg/.gemini/antigravity-ide/brain/7dc37e5c-5c66-47c5-84f8-8260bed1fc89/.system_generated/logs/transcript.jsonl');
const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

const userInputs = [];
rl.on('line', (line) => {
  if (line.includes('"USER_INPUT"')) {
    try {
      const parsed = JSON.parse(line);
      userInputs.push(parsed.content);
    } catch (_) {}
  }
});

rl.on('close', () => {
  console.log('Total user inputs:', userInputs.length);
  userInputs.slice(-6).forEach((content, i) => {
    console.log(`\n--- [${i + 1}] ---`);
    console.log(content.length > 300 ? content.substring(0, 300) + '...' : content);
  });
});
