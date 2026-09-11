const sharp = require('sharp');
sharp('/mnt/c/Users/mlingsch/Apps/RunBradyRun/specialist_sheet.png')
  .metadata()
  .then(m => console.log(`${m.width}x${m.height} ${m.channels}ch format=${m.format}`))
  .catch(e => console.error(e.message));
