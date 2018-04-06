# offlinejs

A simple generator that crawls your build directory and creates a ServiceWorker and injects a loader script into the index.html


Can be configured by creating an offline.json in your project root and calling:
```
offlinejs
```

Use a different config with:
```
offlinejs other-config.json
```

## options
| attribute | default | description |
|-----------|---------|-------------|
| path | "dist" | directory where your project build is generated |
| injectInto | "dist/index.html" | if the script should inject a loader script, if yes set it to "index.html" or the wanted target |
| template | "offline.js" | your ServiceWorker template |
| version | Date.now() | your project build version (new version is required for a new release) |
| exclude | false | regex as string to exclude specific files ( use `[\\\\/]` for slashed to make it OS independent) |
| include | ".*" | control what is loaded (file paths have to pass the exclude and include test) |
| data | {} | a flat object containing any data you need in the template (injection marks in your template shall look like this: `/*[data.apiPort]*/`) |


example offline.json: 
``` json
{
  "path": "dist",
  "injectInto": false,
  "template": "offline.js",
  "exclude": "(assets[\\\\/]fonts[\\\\/].*)",
  "data": {
    "api": ":8080",
    "hostname": "localhost",
    "pushBadge": "http://localhost:4200/assets/push-badge.png"
  }
}
```