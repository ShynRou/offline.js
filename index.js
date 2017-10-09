#!/usr/bin/env node

var fs = require('fs');
var path = require('path');

console.log('\n=========================================================================\nofflinejs executing');

var configFile = 'offline.js';
if (process.argv && process.argv.length > 2) {
  configFile = process.argv[2];
}
console.log('- config '+configFile);

function readFile(path, crashOnFailure) {
  try {
    var filename = require.resolve(path);
    return fs.readFileSync(filename, 'utf8');
  } catch (error) {
    if (crashOnFailure) {
      console.error(error);
      process.exit(1);
    }
  }
}

function walk(dir) {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = path.join(dir, file);
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    }
    else {
      results.push(file);
    }
  });
  return results;
}

const root = process.cwd() || __dirname;

var userConfig = readFile(path.join(root, configFile));

if (userConfig) {
  try {
    userConfig = JSON.parse(userConfig);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  if (userConfig.path) {
    userConfig.path = path.join(root, userConfig.path);
    if (userConfig.injectInto) {
      userConfig.injectInto = path.join(userConfig.path, userConfig.injectInto);
    }
  }
  if (userConfig.template) {
    userConfig.template = path.join(root, userConfig.template);
  }
}

const config = Object.assign(
  {
    path: path.join(root, 'dist'),
    exclude: false,
    include: '.*',
    version: Date.now(),
    template: path.join(__dirname, 'offline.js'),
    injectInto: path.join(root, 'dist/index.html'),
    data: {}
  },
  userConfig
);


// CREATE SERVICE WORKER ==============================================================================
const exclude = config.exclude && new RegExp(config.exclude);
const include = config.include && new RegExp(config.include);


console.log('- search destination '+config.path);
var staticFiles = walk(config.path);
staticFiles = staticFiles.filter(function (f) {
  return f && ((!exclude || !exclude.test(f)) && (include && include.test(f)));
}).map(function (f) {
  var relative = path.relative(config.path, f).replace(/\\/g, '/');
  return '"' + relative + '"';
});

if(staticFiles.indexOf('"offline.js"') < 0) {
  staticFiles.push('"offline.js"');
}
console.log('  - statics found: '+ staticFiles.length);

staticFiles = staticFiles.join(',');

console.log('- load template '+config.template);
var content = readFile(config.template, true);

console.log('  - inject parameters');
content = content.replace(/\/\*\[static_files\]\*\//gi, staticFiles);
content = content.replace(/\/\*\[version\]\*\//gi, config.version);
content = content.replace(/\/\*\[data\]\*\//gi, JSON.stringify(config.data));

// inject data
var dataKeys = Object.keys(config.data);

for(var i = 0; i < dataKeys.length; i++) {
  var regex = new RegExp('\\/\\*\\[data\\.'+dataKeys[i]+'\\]\\*\\/','gi');
  content = content.replace(regex, config.data[dataKeys[i]]);
}

console.log('  - save in destination');
fs.writeFile(
  path.join(config.path, 'offline.js'),
  content,
  function (error) {
    if (error) {
      console.error(error);
      process.exit(1);
    }
  }
);

// INJECT <script> ==============================================================================

if (config.injectInto) {
  console.log('- inject registration '+config.injectInto);
  var injectContent = readFile(config.injectInto, true);
  injectContent
  injectContent = injectContent
    .replace(/(\s*)(\<\/body\>)/, '$1  <script>'+readFile(path.join(__dirname, 'offline.loader.js'))+'</script>$1$2');

  fs.writeFile(
    path.join(config.injectInto),
    injectContent,
    function (error) {
      if (error) {
        console.error(error);
        process.exit(1);
      }
    }
  );
}

console.log('SUCCESS\n=========================================================================');

