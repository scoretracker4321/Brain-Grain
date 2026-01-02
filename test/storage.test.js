const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

let html = fs.readFileSync(path.join(__dirname, '..', 'assessment.html'), 'utf8');
// Inline utils.js to ensure StorageHelper is available in jsdom
const utilsScript = fs.readFileSync(path.join(__dirname, '..', 'utils.js'), 'utf8');
html = html.replace(/<script src="utils.js"><\/script>/, `<script>${utilsScript}</script>`);

describe('StorageHelper', () => {
  let window;
  beforeEach(async () => {
    const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
    window = dom.window;
    // ensure localStorage exists (jsdom provides it, but be defensive in CI)
    if (!window.localStorage) {
      window.localStorage = (function(){
        let s = {};
        return { setItem(k,v){ s[k]=v; }, getItem(k){ return s[k] || null; }, removeItem(k){ delete s[k]; } };
      })();
    }
    // ensure node global also references the same storage so helpers using global.localStorage work
    if (typeof global !== 'undefined') global.localStorage = window.localStorage;
    // wait for inline scripts to run
    await new Promise(r => setTimeout(r, 50));
  });

  test('load and save students works', () => {
    expect(typeof window.StorageHelper).toBe('object');
    const students = [{ id: 's1', firstName: 'A' }];
    const saved = window.StorageHelper.saveStudents(students);
    expect(saved).toBe(true);
    const got = window.StorageHelper.loadStudents();
    expect(Array.isArray(got)).toBe(true);
    expect(got.length).toBe(1);
    expect(got[0].id).toBe('s1');
  });
});
