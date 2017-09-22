#!/usr/bin/env node

var fs = require('fs');
var path = require('path');

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
};

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
};

const root = process.cwd() || __dirname;

var userConfig = readFile(path.join(root, 'offline.json'));

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
    injectInto: path.join(root, 'dist/index.html')
  },
  userConfig
);


// CREATE SERVICE WORKER ==============================================================================
const exclude = config.exclude && new RegExp(config.exclude);
const include = config.include && new RegExp(config.include);

var staticFiles = walk(config.path);
staticFiles = staticFiles.filter(function (f) {
  return f && ((exclude && !exclude.test(f)) || (include && include.test(f)));
}).map(function (f) {
  var relative = path.relative(config.path, f).replace(/\\/g, '/');
  return '"' + relative + '"';
});

if(staticFiles.indexOf('"offline.js"') < 0) {
  staticFiles.push('"offline.js"');
}

staticFiles = staticFiles.join(',');

var content = readFile(config.template, true);

content = content.replace(/\/\*\[static_files\]\*\//gi, staticFiles);
content = content.replace(/\/\*\[version\]\*\//gi, '"' + config.version + '"');

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
