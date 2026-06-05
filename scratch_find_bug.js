const fs = require('fs');
const path = require('path');

function findBug(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      findBug(fullPath);
    } else if (file.name.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const target =
        'return UTF16Decoder.decode(HEAPU8.subarray(ptr,endPtr));var str="";';
      const index = content.indexOf(target);
      if (index !== -1) {
        const unreachableIndex = index + 56;
        const unreachableBefore = content.substring(0, unreachableIndex);
        const uLines = unreachableBefore.split('\n');
        const uLineNo = uLines.length;
        const uColNo = uLines[uLines.length - 1].length + 1;
        console.log(
          fullPath.replace(/\\/g, '/') + ':' + uLineNo + ':' + uColNo,
        );
      }
    }
  }
}

findBug('codecs');
findBug('squoosh/dist/codecs');
