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

const root = (require.main ? path.dirname(require.main.filename) : process.cwd());

var userConfig = readFile(path.join(root, 'offline.json'));

if (userConfig) {
  try {
    userConfig = JSON.parse(userConfig);
  } catch (error) {
    console.error(error);
  }
}

const config = Object.assign(
  {
    path: 'dist',
    exclude: false,
    include: '.*',
    version: Date.now(),
    template: './offline.js',
    injectInto: 'index.html'
  },
  userConfig
);

config.path = path.join(root, config.path);
config.template = path.join(root, config.template);
config.injectInto = path.join(config.path, config.injectInto);


// CREATE SERVICE WORKER ==============================================================================
const exclude = config.exclude && new RegExp(config.exclude);
const include = config.include && new RegExp(config.include);

var staticFiles = walk(config.path);
staticFiles = staticFiles.filter(function (f) {
  return f && ((exclude && !exclude.test(f)) || (include && include.test(f)));
}).map(function (f) {
  var relative = path.relative(config.path, f).replace(/\\/g, '/');
  return '"' + relative + '"';
}).join(',');

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
    .replace(/\s*\<script async src\=\"offline.js\"\>\<\/script\>\s*/g, '')
    .replace(/(\s*)(\<\/body\>)/, '$1  <script async src="offline.js"></script>$1$2');

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
