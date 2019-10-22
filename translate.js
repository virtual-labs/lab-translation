fs = require("fs");
jsdom = require("jsdom");
path = require("path")


// if string contains "http://someting", replace it with "".
// this does not check for link validity.
const removeHttp = (line) =>
  line
    .split(" ")
    .filter(e => !e.includes("http://"))
    .join(" ");



const get_translation_map = (fn) => {

  // read translation file
  const trans = fs.readFileSync(fn, encoding="utf-8");

  
  // create a map
  const tm = trans.split("\n").map( rec => {
    r = rec.split("\t");
    if (r.length < 2){
      return ["", ""];
    }
    // emails
    if (r[0].match(/[a-z]*\@vlabs.ac.in/)) {
      return [r[0].replace(/[a-z]*\@vlabs.ac.in/, ''), r[1].replace(/[a-z]*\@vlabs.ac.in/, '')];
    }  
    return [removeHttp(r[0].replace(/\s+/g, ' ').trim()),
	    removeHttp(r[1].replace(/\s+/g, ' ').trim())
    ]; // remove extra whitespace.
  });


  let tm_new = [];
  tm.forEach( t => {
    // split some values

    if (t[0].split("").map( c => c.charCodeAt()).includes(8594)){

      // complicated process to achieve splitting at arrow.
      en = t[0].split("").map( c => {
	code = c.charCodeAt();
	if (code === 8594) {
	  return ">";
	}
	else {
	  return String.fromCharCode(code);
	}
      }).join("").split(">");

      ol = t[1].split("").map( c => {
	code = c.charCodeAt();
	if (code === 8594) {
	  return ">";
	}
	else {
	  return String.fromCharCode(code);
	}
      }).join("").split(">");

      const new_maps = en.map( (e, i) => [e, ol[i]] );
      tm_new = tm_new.concat(new_maps);
    }
    else {
      tm_new.push(t);
    }
  });


  const tm_new_ = [];
  tm_new.forEach( t => {
    
    // to fix the steps: 1 sections
    if ( t[0].match(/Step[\s]*\d\:/) ) {
      // if this is it, split it
      si = t[0].match(/\d/).index + 2; // split at the number 
      left = t[0].slice(0, si);
      right = t[0].slice(si, t[0].length);

      // same for the other language
      sio = t[1].match(/\d/).index + 2; // split at the number 
      lefto = t[1].slice(0, sio);
      righto = t[1].slice(sio, t[1].length);

      // concat the new records to the tr map
      tm_new_.push([left, lefto]); 
      tm_new_.push([right, righto]);
      
    }
    else {
      tm_new_.push(t);
    }
  });
  return tm_new_;
};


// navigation item translations for the lab home
const lab_navigation = {
  "hin": {
    "Introduction": "परिचय",
    "Experiments": "प्रयोग",
    "Target Audience": "लक्ष्य श्रोतागण",
    "Courses Aligned": "पाठ्यक्रम संरेखित",
    "Pre-requisite Softwares": "पूर्व-अपेक्षित सॉफ्टवेयर्स",
    "Feedback": "प्रतिक्रिया"
  },
  "tel": {
    "Introduction": "పరిచయం",
    "Experiments": "ప్రయోగాలు",
    "Target Audience": "లక్ష్య ప్రేక్షకులకు",
    "Courses Aligned": "కోర్సులు సమలేఖనం చేయబడ్డాయి",
    "Pre-requisite Softwares": "ముందస్తు అవసరమైన సాఫ్ట్‌వేర్‌లు",
    "Feedback": "అభిప్రాయం"
  }
};

// navigation item translations for experiments
const exp_navigation = {
  "hin": {
    "Introduction": "प्रस्तावना/भूमिका",
    "Theory": "परिकल्पना/सिद्धांत",
    "Objective": "उद्देश्य(ऑब्जेक्टिव)",
    "Experiment": "प्रयोग (एक्सपेरिमेंट)",
    "Manual": "मैनुअल",
    "Quizzes": "प्रश्नावली (क्विज़)",
    "Further Readings": "अतिरिक्त जानकारी (रीडिंग)",
    "Feedback": "प्रतिक्रिया (फीडबैक)"
  },
  "tel": {
    "Introduction": "పరిచయం",
    "Theory": "థియరీ",
    "Objective": "ఆబ్జెక్టివ్",
    "Experiment": "ప్రయోగం",
    "Manual": "మాన్యువల్",
    "Quizzes": "క్విజ్",
    "Further Readings": "మరింత రీడింగ్స్",
    "Feedback": "అభిప్రాయం(ఫీడ్బ్యాక్)"
  }
};



// find transration for an english phrase.
const find_trans = (et, tm, lang) => {


  // if it is a link, do nothing
  if ( et.includes("http://") ) return et;

  // if it is just a number, do nothing
  if (et.trim().match(/^\d+$/)) return et;

  // if it is just a number followed by . (ex: "2." ), do nothing
  if (et.trim().match(/^\d+\.$/)) return et;

  
  
  // translation of navigation items does not work
  // due to translation file formating issues.
  // Use the lab_navigation map instead.
  if (Object.keys(lab_navigation[lang]).includes(et)){
    return lab_navigation[lang][et];
  }

  if (Object.keys(exp_navigation[lang]).includes(et)){
    return exp_navigation[lang][et];
  }

  // arrow
  if (et.trim().charCodeAt() === 8594) {
    return et;
  }

  const res = tm.filter( t => t[0].trim() === et.replace(/\s+/g, ' ').trim());

  if (res && res.length > 0) {
    return res[0][1];
  }
  else {
    // if it is the arrow character
    return (et + " --> error!!!");
  }
};


const {JSDOM} = jsdom;


const fix_footer = (dom, lang) => {

  //does not work for telugu right now.  Need to create a telugu footer.
  footer_file = `new-footer-${lang}.html`;
  const footer = fs.readFileSync(footer_file, encoding="utf-8");
  fdom = new JSDOM(footer);
  old_f = dom.window.document.querySelector("footer");
  new_f = fdom.window.document.querySelector("footer");
  if (old_f && new_f) {
    old_f.innerHTML = new_f.innerHTML;
  }
};


const translate = (efn, tfn, lang) => {
  const tm = get_translation_map(tfn);
//  fs.writeFileSync(path.basename(efn) + "__tmap.json", JSON.stringify(tm));
  const enhtml = fs.readFileSync(efn, encoding="utf-8");
  const dom = new JSDOM(enhtml);
  const tw = dom.window.document.createTreeWalker(
    dom.window.document.body, dom.window.NodeFilter.SHOW_TEXT);
  const nodes = [];
  while(tw.nextNode()) {
    if (!(tw.currentNode.wholeText.trim() === "")) {
      if (!(tw.currentNode.parentElement.type === "text/javascript")){
	nodes.push(tw.currentNode);
      }
    }
  }
  nodes.forEach(n => n.textContent = find_trans(n.wholeText, tm, lang));
  
  // replace footer.  This is temporarily required because the translation was done before footer changed.
  try {
    fix_footer(dom, lang);
  }
  catch (e) {
    console.log(e);
  }
  return dom.serialize();
};


// batch translation
const translate_lab = (lab_path, trans_path, exp, lang) => {

  fs.readdirSync(path.join(lab_path, exp), {withFileTypes:true})
    .filter(e => e.isFile())
    .filter(e => path.extname(e.name) === '.html')
    .forEach(e => {
      
      // name of the translation file is derived from the name of the html file
      const html_fn = path.basename(e.name, ".html");
      
      //---------------options for filename--------------------
      const filename_opts = [
	`${html_fn}_eng_${lang}-file.txt`,
	`${html_fn}-eng_${lang}-file.txt`,
	`${html_fn}.txt`
      ]

      // pick the name, for which a file exists.
      const tfn = filename_opts.filter( fn => {
	try {
	  f = fs.readFileSync(path.join(trans_path, exp, fn));
	  return true;
	}
	catch {
	  return false; // file not found
	}
      })[0]; // filtering should return array of size 1

      if (!tfn) {
	console.log("problem ::  ", tfn, html_fn);
      }
      else {
	const tfp = path.join(trans_path, exp, tfn); // translation file path.      
	const hfp = path.join(lab_path, exp, e.name); // html file path.
	try {
	  // translate and write to file
	  const trns = translate(hfp, tfp, lang);
	  fs.writeFileSync(hfp, trns);
	}
	catch(e){
	  //console.log(e);
	}
      }
    });
};


//============== CONFIG ==================================
const tcfg = JSON.parse(fs.readFileSync("transConfig.json"));
//=============  RUN  ================================

const run = (lang) => {
  translate_lab(tcfg[lang].LAB_PATH,
		tcfg[lang].TRANS_PATH,
		exp="",
		lang=lang);
  tcfg.experiments.forEach( e => {
    translate_lab(tcfg[lang].LAB_PATH,
		  tcfg[lang].TRANS_PATH,
		  exp=e,
		  lang=lang);
  });
};

process.argv.slice(2).forEach(l => run(l));
