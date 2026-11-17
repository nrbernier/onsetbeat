// Loads the shared core of index.html (analysis, chart generation, layout) into Node.
// Everything between /*CORE-START*/ and /*CORE-END*/ must run without a browser.
const fs = require('fs'), path = require('path');
function loadCore(patch) {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  let core = html.slice(html.indexOf('/*CORE-START*/'), html.indexOf('/*CORE-END*/'));
  if (patch) core = patch(core);
  return new Function(core + '\nreturn { analyzeAudio, prepareAnalysis, generateMap, sliderPosAt, DIFFS, ...(typeof applyBeatFix === "function" ? { applyBeatFix } : {}) };')();
}
module.exports = { loadCore };
