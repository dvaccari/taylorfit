
const appStart = Date.now();

if (typeof performance === 'undefined') {
  let entries = {};

  var performance = {};

  performance.mark = (name) => {
    if (!(name in entries)) {
      entries[name] = [];
    }
    entries[name].push({
      duration: 0,
      entryType: 'mark',
      name,
      startTime: Date.now() - appStart
    });
  };

  performance.getEntriesByName = (name) => {
    let results = [];

    for (let entry in entries) {
      if (entry === name) {
        results = results.concat(entries[entry]);
      }
    }
    return results;
  };
}

function start(name) {
  performance.mark(name + ':start');
}

function end(name) {
  performance.mark(name + ':end');
  //performance.measure(name + ':measure', name + ':start', name + ':end');
}


start('thing');

setTimeout(() => {
  end('thing');
  console.log(performance.getEntriesByName('thing:start'));
  console.log(performance.getEntriesByName('thing:end'));
}, 3000);
