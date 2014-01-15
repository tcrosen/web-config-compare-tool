// The original (master) file to compare against
var existingConfig = {
  name: 'HondaProdWeb1.config',
  path: 'examples\\',
  parsedResult: null,
  fullPath: function() {
    return this.path + this.name;
  }
},

    // the new file which needs to be tested
    newConfig = {
      name: 'Web.config',
      path: 'C:\\Terry\\Development\\Publish Tests\\MC\\',
      parsedResult: null,
      fullPath: function() {
        return this.path + this.name;
      }
    };

    var fs = require('fs'),
    xml2js = require('xml2js'),
    parser = new xml2js.Parser(),
    should = require('should'),
    _ = require('lodash'),
    args = process.argv,
    logFile = 'compare.log';    

    function logMessage (msg) {
      console.log(msg);
      fs.appendFileSync(logFile, msg + '\n');
    }

// parse an XML file into memory
function parseFile(filePath, done) {
  fs.readFile(filePath, function(err, data) {
    parser.parseString(data, function (err, result) {        
      done(err, result);
    });
  });
}

// write the JS objects to a file as JSON 
// *helpful for debugging output
function writeOutputAsJson(outputFilePath, result, done) {
  fs.writeFile(outputFilePath, JSON.stringify(result, null, 2), function(err) {
    if(err) {
      logMessage(err);
    } else {        
      logMessage('JSON saved to ' + outputFilePath);
      if (done) done();
    }
  }); 
}

// parse the files into JS objects
function loadConfigs(done) {
  logMessage('Loading ' + existingConfig.fullPath() + ' for parsing...');
  parseFile(existingConfig.fullPath(), function(err, result1) {
    if (err) { 
      logMessage('Error parsing ' + existingConfig.fullPath());  
    } else {
      writeOutputAsJson('file1.json', result1, function(err) {
        existingConfig.parsedResult = result1;          
        logMessage('Loading ' + newConfig.fullPath() + ' for parsing...');
        parseFile(newConfig.fullPath(), function(err, result2) {
          if (err) { 
            logMessage('Error parsing ' + newConfig.fullPath());  
          } else {
            writeOutputAsJson('file2.json', result2, function(err) {
              newConfig.parsedResult = result2;
              done();
            });
          }
        });
      });
    }
  });
};  

// logMessage('Validating args...');
// args.should.exist;

// // The first element will be 'node', the second element will be the name of the JavaScript fil
// // http://nodejs.org/docs/latest/api/process.html#process_process_argv
// //args.should.have.length(5);

// var env = args[2].toUpperCase(),
//     configType = args[3].toUpperCase();

fs.writeFileSync(logFile, '');
logMessage('***********************************************************************');
logMessage(new Date());
logMessage('-----------------------------------------------------------------------');
logMessage('Running comparison for the following: ');
logMessage('File 1: ' + existingConfig.fullPath());
logMessage('File 2: ' + newConfig.fullPath());
logMessage('Logging compare results to: ' + logFile);
logMessage('-----------------------------------------------------------------------');
// existingConfig.name = ENVIRONMENT_CONFIG_PATHS[env][configType];
// newConfig.name = 'C:\\Terry\\Development\\Publish Tests\\Staging\\Web.config'; //args[4];

// Load configs into memory and run tests
loadConfigs(function() {
  // temporary placeholders for data from each file
  var temp1, temp2;

  logMessage('-----------------------------------------------------------------------');
  logMessage('[Test] Both files should have the same # of <connectionStrings> <add> nodes');
  
  try {
    temp1 = existingConfig.parsedResult.configuration.connectionStrings[0].add,
    temp2 = newConfig.parsedResult.configuration.connectionStrings[0].add;
    temp1 = temp1 ? temp1.length : 0;
    temp2 = temp2 ? temp2.length : 0;
    temp1.should.eql(temp2); 
    logMessage('[Passed]');
  } catch (e) {
    logMessage('[Failure] ' + e.message);
    logMessage('[Info] File 1 <add> nodes: ' + temp1);
    logMessage('[Info] File 2 <add> nodes: ' + temp2);
  }

  logMessage('-----------------------------------------------------------------------');
  logMessage('[Test] both files should have the same # of <connectionStrings> <remove> nodes');  

  try {
    temp1 = existingConfig.parsedResult.configuration.connectionStrings[0].remove,
    temp2 = newConfig.parsedResult.configuration.connectionStrings[0].remove;
    temp1 = temp1 ? temp1.length : 0;
    temp2 = temp2 ? temp2.length : 0;
    temp1.should.eql(temp2); 
    logMessage('[Passed]');
  } catch (e) {    
    logMessage('[Failure] ' + e.message);
    logMessage('[Info] File 1 <remove> nodes: ' + temp1);
    logMessage('[Info] File 2 <remove> nodes: ' + temp2);
  }

  logMessage('-----------------------------------------------------------------------');
  logMessage('[Test] <connectionStrings> <add> names should be the same in both files');
  
  try {
    temp1 = _.map(existingConfig.parsedResult.configuration.connectionStrings[0].add, function(add) { return add.$.name; });
    temp2 = _.map(newConfig.parsedResult.configuration.connectionStrings[0].add, function(add) { return add.$.name; });
    _.difference(temp1, temp2).should.be.empty;      
    _.difference(temp2, temp1).should.be.empty;    
    logMessage('[Passed]');
  } catch (e) {    
    logMessage('[Failure] ' + e.message);
    logMessage('[Info] <add> names in File 1 NOT in File 2: ' + _.difference(temp1, temp2));
    logMessage('[Info] <add> names in File 2 NOT in File 1: ' + _.difference(temp2, temp1));
  }

  logMessage('-----------------------------------------------------------------------');
  logMessage('[Test] <connectionStrings> <remove> names should be the same in both files');
  
  try {
    temp1 = _.map(existingConfig.parsedResult.configuration.connectionStrings[0].remove, function(remove) { return remove.$.name; }),
    temp2 = _.map(newConfig.parsedResult.configuration.connectionStrings[0].remove, function(remove) { return remove.$.name; });
    _.difference(temp1, temp2).should.be.empty;
    _.difference(temp2, temp1).should.be.empty;  
    logMessage('[Passed]');
  } catch (e) {    
    logMessage('[Failure] ' + e.message);
    logMessage('[Info] <remove> names in File 1 NOT in File 2: ' + _.difference(temp1, temp2));
    logMessage('[Info] <remove> names in File 2 NOT in File 1: ' + _.difference(temp2, temp1));
  }

  logMessage('-----------------------------------------------------------------------');
  logMessage('[Test] <add> nodes should have the same connectionString values compared by name');
  var failures = [];
  temp1 = _.map(existingConfig.parsedResult.configuration.connectionStrings[0].add, function(add) { return add.$; }),
  temp2 = _.map(newConfig.parsedResult.configuration.connectionStrings[0].add, function(add) { return add.$; });

  _.forEach(temp1, function(conn1) {
    var matchedNode = _.find(temp2, function(conn2) {
      return conn2.name === conn1.name;
    });

    if (matchedNode && matchedNode.connectionString !== conn1.connectionString) {
      failures.push({ name: matchedNode.name, file1Value: conn1.connectionString, file2Value: matchedNode.connectionString });
    }      
  });  

  try {
    failures.should.be.empty;
    logMessage('[Passed]');
  } catch (e) {    
    logMessage('[Failure] ' + e.message);
  }

  logMessage('-----------------------------------------------------------------------');
  logMessage('[Test] Both files should have the same # of <appSettings> <add> nodes');
  
  try {
    temp1 = existingConfig.parsedResult.configuration.appSettings[0].add,
    temp2 = newConfig.parsedResult.configuration.appSettings[0].add;
    temp1 = temp1 ? temp1.length : 0;
    temp2 = temp2 ? temp2.length : 0;
    temp1.should.eql(temp2); 
    logMessage('[Passed]');
  } catch (e) {
    logMessage('[Failure] ' + e.message);
    logMessage('[Info] File 1 <add> nodes: ' + temp1);
    logMessage('[Info] File 2 <add> nodes: ' + temp2);
  }

  logMessage('-----------------------------------------------------------------------');
  logMessage('[Test] both files should have the same # of <appSettings> <remove> nodes');  

  try {
    temp1 = existingConfig.parsedResult.configuration.appSettings[0].remove,
    temp2 = newConfig.parsedResult.configuration.appSettings[0].remove;
    temp1 = temp1 ? temp1.length : 0;
    temp2 = temp2 ? temp2.length : 0;
    temp1.should.eql(temp2); 
    logMessage('[Passed]');
  } catch (e) {    
    logMessage('[Failure] ' + e.message);
    logMessage('[Info] File 1 <remove> nodes: ' + temp1);
    logMessage('[Info] File 2 <remove> nodes: ' + temp2);
  }

  logMessage('-----------------------------------------------------------------------');
  logMessage('[Test] <appSettings> <add> keys should be the same in both files');
  
  try {
    temp1 = _.map(existingConfig.parsedResult.configuration.appSettings[0].add, function(add) { return add.$.key; });
    temp2 = _.map(newConfig.parsedResult.configuration.appSettings[0].add, function(add) { return add.$.key; });
    _.difference(temp1, temp2).should.be.empty;      
    _.difference(temp2, temp1).should.be.empty;    
    logMessage('[Passed]');
  } catch (e) {    
    logMessage('[Failure] ' + e.message);
    logMessage('[Info] <remove> keys in File 1 NOT in File 2: ' + _.difference(temp1, temp2));
    logMessage('[Info] <remove> keys in File 2 NOT in File 1: ' + _.difference(temp2, temp1));
  }

  logMessage('-----------------------------------------------------------------------');
  logMessage('[Test] <appSettings> <remove> keys should be the same in both files');
  
  try {
    temp1 = _.map(existingConfig.parsedResult.configuration.appSettings[0].remove, function(remove) { return remove.$.key; }),
    temp2 = _.map(newConfig.parsedResult.configuration.appSettings[0].remove, function(remove) { return remove.$.key; });
    _.difference(temp1, temp2).should.be.empty;
    _.difference(temp2, temp1).should.be.empty;  
    logMessage('[Passed]');
  } catch (e) {    
    logMessage('[Failure] ' + e.message);
    logMessage('[Info] <remove> keys in File 1 NOT in File 2: ' + _.difference(temp1, temp2));
    logMessage('[Info] <remove> keys in File 2 NOT in File 1: ' + _.difference(temp2, temp1));
  }

  logMessage('-----------------------------------------------------------------------');
  logMessage('[Test] <add> nodes should have the same <appSettings> values compared by key');
  var failures = [];
  temp1 = _.map(existingConfig.parsedResult.configuration.appSettings[0].add, function(add) { return add.$; }),
  temp2 = _.map(newConfig.parsedResult.configuration.appSettings[0].add, function(add) { return add.$; });

  _.forEach(temp1, function(appSetting1) {
    var matchedNode = _.find(temp2, function(appSetting2) {
      return appSetting2.key === appSetting1.key;
    });

    if (matchedNode && matchedNode['value'] !== appSetting1['value']) {
      failures.push({ key: matchedNode.key, file1Value: appSetting1['value'], file2Value: matchedNode['value'] });
    }      
  });  

  try {
    failures.should.be.empty;
    logMessage('[Passed]');
  } catch (e) {    
    logMessage('[Failure] ' + e.message);
  }

  logMessage('-----------------------------------------------------------------------');
  logMessage('[Test] <system.web> <machineKey> should be the same in both files');
  
  try {
    temp1 = existingConfig.parsedResult.configuration['system.web'][0].machineKey;
    temp2 = newConfig.parsedResult.configuration['system.web'][0].machineKey;
    temp1.should.eql(temp2);
    logMessage('[Passed]');
  } catch (e) {    
    logMessage('[Failure] ' + e.message);
  }

  logMessage('-----------------------------------------------------------------------');
  logMessage('[Test] <system.web> <customErrors> should be the same in both files');
  
  try {
    temp1 = existingConfig.parsedResult.configuration['system.web'][0].customErrors;
    temp2 = newConfig.parsedResult.configuration['system.web'][0].customErrors;
    temp1.should.eql(temp2);
    logMessage('[Passed]');
  } catch (e) {    
    logMessage('[Failure] ' + e.message);
  }

  logMessage('-----------------------------------------------------------------------');
  logMessage('[Test] <system.webServer> <rewrite> rule names should be the same in both files');
  
  try {
    temp1 = _.map(existingConfig.parsedResult.configuration['system.webServer'][0].rewrite[0].rules[0].rule, function(rule) { return rule.$.name; })
    temp2 = _.map(newConfig.parsedResult.configuration['system.webServer'][0].rewrite[0].rules[0].rule, function(rule) { return rule.$.name; })
    _.difference(temp1, temp2).should.be.empty;
    _.difference(temp2, temp1).should.be.empty;  
    logMessage('[Passed]');
  } catch (e) {    
    logMessage('[Failure] ' + e.message);
    logMessage('[Info] <rewrite> names in File 1 NOT in File 2: ' + _.difference(temp1, temp2));
    logMessage('[Info] <rewrite> names in File 2 NOT in File 1: ' + _.difference(temp2, temp1));
  }

  logMessage('-----------------------------------------------------------------------');
  logMessage('[Test] <system.webServer> <rewrite> rules URL matches should be equal');
  
  temp1 = existingConfig.parsedResult.configuration['system.webServer'][0].rewrite[0].rules[0].rule;
  temp2 = newConfig.parsedResult.configuration['system.webServer'][0].rewrite[0].rules[0].rule;
  failures = [];

  _.forEach(temp1, function(rule1) {
    var matchedNode = _.find(temp2, function(rule2) {
      return rule2.$.name === rule1.$.name;
    });

    if (matchedNode) {
      if (matchedNode.match[0].$.url !== rule1.match[0].$.url) {        
        failures.push({ 
          name: matchedNode.$.name, 
          file1MatchUrl: rule1.match[0].$.url, 
          file2MatchUrl: matchedNode.match[0].$.url
        });
      }
    }      
  });  

  try {    
    failures.should.be.empty;
    logMessage('[Passed]');
  } catch (e) {    
    logMessage('[Failure] ' + e.message);
  }

  logMessage('-----------------------------------------------------------------------');
  logMessage('[Test] <system.webServer> <rewrite> rules URL actions should be equal');
  
  temp1 = existingConfig.parsedResult.configuration['system.webServer'][0].rewrite[0].rules[0].rule;
  temp2 = newConfig.parsedResult.configuration['system.webServer'][0].rewrite[0].rules[0].rule;
  failures = [];

  _.forEach(temp1, function(rule1) {
    var matchedNode = _.find(temp2, function(rule2) {
      return rule2.$.name === rule1.$.name;
    });

    if (matchedNode) {
      if (matchedNode.action && matchedNode.action[0] && rule1.action && rule1.action[0] && matchedNode.action[0].$.url !== rule1.action[0].$.url) {
        failures.push({ 
          name: matchedNode.$.name, 
          file1ActionUrl: rule1.action[0].$.url, 
          file2ActionUrl: matchedNode.action[0].$.url  
        });
      }
    }      
  });  

  try {    
    failures.should.be.empty;
    logMessage('[Passed]');
  } catch (e) {    
    logMessage('[Failure] ' + e.message);
  }

  logMessage('-----------------------------------------------------------------------');
  logMessage('All tests complete\n\n');
});


