/**
 * Created by Xeonkung on 7/11/2017.
 */
'use strict';

/**
 * Package dependencies
 */
var Horseman = require('node-horseman')
    , validUrl = require('valid-url')
    , fs = require('fs')
    , path = require('path')
    , prompt = require('prompt')
    , tabletojson = require('tabletojson')
    , j2a = require('./json2array')
    , xlsx = require('node-xlsx')
    , program = require('commander');

program
    .version('1.0.0')
    .option('-d --data-file [string]', 'a xlsx file name')
    .option('-s --ss-file [string]', 'a screen shot file name')
    .option('-f --folder-path [string]', 'folder path')
    .parse(process.argv);
var supportedActions = [];
var isVisible = function (selector) {
    return $(selector).is(':visible');
};
var table2json = function (selector) {
    // return $(selector).tableToJSON();
    return $(selector).html();
};
var createXlsx = function(sheets, path, done) {
    var b = xlsx.build(sheets);
    fs.writeFile(path, b, 'binary', function (err) {
        if (err) {
            console.error(err);
        } else {
            console.info('Save file to ' + path);
        }
        done();
    });
};
var pushToSheets = function (selector, sName, sheets) {
    var self = this;
    return this
        .evaluate(table2json, selector)
        .then(function (res) {
            if (res) {
                var table = '<table>'+res+'</table>';
                var tableJson = tabletojson.convert(table);
                sheets.push({
                    name: sName,
                    data: j2a(tableJson[0])
                });
            }
        });
};
Horseman.registerAction('pushToSheets', pushToSheets);
var loadPhantomInstance = function () {

    var options = {
        loadImages: true,
        injectJquery: true,
        injectBluebird: false,
        webSecurity: true,
        ignoreSSLErrors: true,
        timeout: 13000,
        interval: 100,
        diskCache: true,
        diskCachePath: './cache/'
    };

    var phantomInstance = new Horseman(options);

    phantomInstance.on('consoleMessage', function (msg) {
        console.log('Phantom page log: ', msg);
    });

    phantomInstance.on('error', function (msg) {
        console.log('Phantom page error: ', msg);
    });

    phantomInstance.on('resourceRequested', function (requestData, networkRequest) {
        console.log('Phantom requested log: ', requestData.url);
    });

    return phantomInstance;
};

/**
 * Triggers execution of the appropriate action
 */
var main = function () {
    var folderPath = program.folderPath || './dist';
    var dataFile = program.dataFile || 'data.xlsx';
    var ssFile = program.dataFile || 'ss.png';
    var phantomInstance = loadPhantomInstance();
    var sheets = [];
    prompt.start();
    prompt.override = program;
    phantomInstance
        .userAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36')
        .viewport(1280, 800)
        .open('https://wwwn.cdc.gov/foodnetfast/')
        .pushToSheets('#placeHolderForm_GridViewTabularContentArea1', 'Incidence of Confirmed Infections by Year', sheets)
        .pushToSheets('#placeHolderForm_GridViewTabularContentArea2', 'Percentage of Confirmed Infections by Month', sheets)
        .pushToSheets('#placeHolderForm_GridViewTabularContentArea3', 'Distribution of Confirmed Infections', sheets)
        .pushToSheets('#placeHolderForm_GridView8', 'By the Numbers', sheets)
        .do(function (done) {
            createXlsx(sheets, path.join(folderPath, dataFile), done);
        })
        .screenshot(path.join(folderPath, ssFile))
        .close();
    //     // .click('#ui-id-3')
    //     // .waitFor(isVisible,'#ui-id-4', true)
    //     // .wait(5000)
    //     //.type('input[name="q"]', 'github')
    //     //.click('[name="btnK"]')
    //     //.keyboardEvent('keypress', 16777221)
    //     //.waitForSelector('div.g')
    //     //.count('div.g')
    //     //.log() // prints out the number of results
    //     .evaluate(table2json, '#placeHolderForm_GridViewTabularContentArea1')
    //     .then(function (res) {
    //         console.log(JSON.stringify(res));
    //     });
    // phantomInstance
    //     .screenshot('ss.png')
    //     .close();
};

/**
 * Run immediately on script load to determine available actions and attempt to run the specified action
 */
(function () {
    // Generate an array of supported actions based on the files present in the 'actions' directory
    fs.readdir('./src/actions', function (err, files) {

        files.forEach(function (filename) {
            supportedActions.push(filename.split('.')[0]);
        });

        main();
    });
})();