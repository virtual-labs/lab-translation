const glob = require('glob');
const path = require('path');
const fs = require('fs');
const jsdom = require("jsdom");
const {Translate} = require('@google-cloud/translate');

//const lab_root = 'mashi/molecular-absorption-spectroscopy-responsive-lab/src/lab';
//const lab_root = 'maste/molecular-absorption-spectroscopy-responsive-lab/src/lab';
const lab_root = 'physical-chemistry-iiith-js-hi/src/lab/exp8/';

const opt = process.argv[2];

let hpat = path.join(lab_root, '**/*.html');

switch (opt) {
  case 'extract':
    extract(hpat);
    break;
  case 'translate':    
    let jpat = path.join(lab_root, '**/*.json');
    translate(jpat, false, 'hi');
    break;
  case 'rebuild':
    rebuild(hpat);
    break;
}

function extract(pat) {
  glob(pat, function(err, files) {
    console.log("extracting:");
    console.log(files);
    files.forEach(fn => extract_json(fn));
  });
}


function translate(pat, force, lang) {
  glob(pat, function(err, files) {
    console.log(files.length);
    if (force){
      files.forEach(fn => translate_json(fn, lang));
    }
    else {
      failed = files.filter( fn => isTranslated(fn));
      console.log(failed.length);
      failed.forEach(fn => translate_json(fn, lang));
    }
  });
}

function rebuild(pat) {
  glob(pat, function(err, files) {
    console.log("rebuild");
    files.forEach(fn => rebuild_html(fn));
  });
}


function isTranslated(fn) {
  /* returns true if a json file has not been translated.
     to identify if a json file has been translated or not,
     just check if the object it contains is an array or not.
     if it is an array, then it has not been translated.
   */
  const jsoncontent = JSON.parse(fs.readFileSync(fn, encoding='utf-8'));
  return Array.isArray(jsoncontent);
}


function translate_json(fn, lang){

  process.env['GOOGLE_APPLICATION_CREDENTIALS'] = 'Lab Translation-88029d170826.json';  
  // Instantiates a client
  const translate = new Translate({projectId: "lab-translation"});

  const enjson = fs.readFileSync(fn, encoding="utf-8");
  const content = JSON.parse(enjson);
  async function translate_string(text) {
    // The target language
    const target = lang;
    const [translation] = await translate.translate(text, target);
    return [text, translation];
  }

  async function translate_content(ctnt) {
    const translation_promises =  ctnt.map( i =>
      translate_string(i).catch((e) => {console.log(e)})
    );
    const translation_results = {};
    for await (const tr of translation_promises) {
      translation_results[tr[0]] = tr[1];
    }
    console.log(`translated:${fn}`);
    fs.writeFileSync(fn, JSON.stringify(translation_results));
  }
  
  translate_content(content).catch((e) => {console.log(e)});
}



function rebuild_html(html_file_path){
  console.log(html_file_path);
  const {JSDOM} = jsdom;  
  const html_file_name = path.parse(html_file_path).name;
  const html_loc = path.dirname(html_file_path);
  const json_fn = path.join(html_loc, `${html_file_name}.json`);
  const enhtml = fs.readFileSync(html_file_path, encoding="utf-8");

  try{
    trans = JSON.parse(fs.readFileSync(json_fn, encoding="utf-8"));
  }
  catch(e){
    console.log(`no file ${html_file_path}`);
    return;
  }
  
  const dom = new JSDOM(enhtml);
  
  const tw = dom.window.document.createTreeWalker(
    dom.window.document.body, dom.window.NodeFilter.SHOW_TEXT);
  
  while(tw.nextNode()) {
    if (!(tw.currentNode.wholeText.trim() === "")) {
      if (!(tw.currentNode.parentElement.type === "text/javascript")){
	tc = trans[tw.currentNode.textContent.trim()];
	tw.currentNode.textContent = tc;
      }
    }
  }
  
  // write this list to a json file
  fs.writeFileSync(html_file_path, dom.serialize());
}


// rsync -aIv --exclude '.git' masen/ mashi/
// node find_untranslated.js
// cd mashi/<labname>/src/; make
// cd ../build
// python3 -m http.server


function extract_json(html_file_path) {

  const {JSDOM} = jsdom;
  
  // read the html file in english
  const html_file_name = path.parse(html_file_path).name;
  const html_loc = path.dirname(html_file_path);
  const json_fn = path.join(html_loc, `${html_file_name}.json`);
  const enhtml = fs.readFileSync(html_file_path, encoding="utf-8");
  
  // this list will store all the text content in the above html
  // document.
  const text_content = [];
  const dom = new JSDOM(enhtml);
  
  const tw = dom.window.document.createTreeWalker(
    dom.window.document.body, dom.window.NodeFilter.SHOW_TEXT);
  

  // traverse the DOM tree and whenever there is a node that contains
  // some text content, add it to the text_content list.  
  
  // NOTE: while saving, the text is trimmed, i.e. all the whitespaces
  // are removed from starting and end of the string.  So, while
  // searching also, first trim, then search.
  
  while(tw.nextNode()) {
    if (!(tw.currentNode.wholeText.trim() === "")) {
      if (!(tw.currentNode.parentElement.type === "text/javascript")){
	text_content.push(tw.currentNode.textContent.trim());
      }
    }
  }
  
  // write this list to a json file
  fs.writeFileSync(json_fn, JSON.stringify(text_content));
}
