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
    , defaults = require('defaults')
    , program = require('commander');

program
    .version('1.0.0')
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
var createXlsx = function (sheets, path, done) {
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
var afn = function (old, add) {
    // Append File Name
    var ext = path.extname(old);
    return path.basename(old, ext) + add + ext;
};
var pushToSheets = function (selector, sName, sheets) {
    var self = this;
    return this
        .evaluate(table2json, selector)
        .then(function (res) {
            if (res) {
                var table = '<table>' + res + '</table>';
                var tableJson = tabletojson.convert(table);
                sheets.push({
                    name: sName,
                    data: j2a(tableJson[0])
                });
            }
        });
};
var existCrop = function (selector, name) {
    var self = this;
    return this
        .exists(selector)
        .then(function (r) {
            if (r) {
                return self.crop(selector, name)
            }
        });
}
var searchOption = function (options) {
    var _options = defaults(options, {
        year: {start: 1996, end: 2016},
        ages: [],
        pathogen: [],
    });
    var prop = this;
    if (_options.year.start != 1996) {
        prop = prop.select('#placeHolderForm_DropDownListBasicYearsFrom', _options.year.start)
            .waitForNextPage({timeout: 10000});
    }
    if (_options.year.end != 2016) {
        prop = prop.select('#placeHolderForm_DropDownListBasicYearsTo', _options.year.end)
            .waitForNextPage({timeout: 10000});
    }
    for (var i = 0; i < _options.ages.length; i++) {
        prop = prop.select('#placeHolderForm_DropDownListFilterAges', _options.ages[i])
            .waitForNextPage({timeout: 10000});
    }
    for (var i = 0; i < _options.pathogen.length; i++) {
        prop = prop.select('#placeHolderForm_DropDownListFilterPathogens', _options.pathogen[i])
            .waitForNextPage({timeout: 10000});
    }
    return prop;
}
Horseman.registerAction('pushToSheets', pushToSheets);
Horseman.registerAction('searchOption', searchOption);
Horseman.registerAction('existCrop', existCrop);
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
var main = function (opts, idx = 0) {
    var folderPath = program.folderPath || './dist';
    var dataFile = opts.dataName || 'data' + idx + '.xlsx';
    var ssFile = opts.ssName || 'ss' + idx + '.png';
    var phantomInstance = loadPhantomInstance();
    var sheets = [];

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }
    phantomInstance
        .userAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36')
        .viewport(1280, 800)
        .open('https://wwwn.cdc.gov/foodnetfast/')
        .searchOption(opts)
        .pushToSheets('#placeHolderForm_GridViewTabularContentArea1', 'Incidence of Confirmed Infections by Year', sheets)
        .existCrop('#placeHolderForm_XLargeContent1', path.join(folderPath, afn(ssFile, 'Incidence')))
        .pushToSheets('#placeHolderForm_GridViewTabularContentArea2', 'Percentage of Confirmed Infections by Month', sheets)
        .existCrop('#placeHolderForm_XLargeContent2', path.join(folderPath, afn(ssFile, 'Percentage')))
        .pushToSheets('#placeHolderForm_GridViewTabularContentArea3', 'Distribution of Confirmed Infections', sheets)
        .existCrop('#placeHolderForm_LargeContent3', path.join(folderPath, afn(ssFile, 'Distribution')))
        .pushToSheets('#placeHolderForm_GridViewTabularContentArea4', 'Age Group', sheets)
        .existCrop('#placeHolderForm_SmallContent4', path.join(folderPath, afn(ssFile, 'Age')))
        .pushToSheets('#placeHolderForm_GridViewTabularContentArea5', 'Sex', sheets)
        .existCrop('#placeHolderForm_SmallContent5', path.join(folderPath, afn(ssFile, 'Sex')))
        .pushToSheets('#placeHolderForm_GridViewTabularContentArea6', 'Race', sheets)
        .existCrop('#placeHolderForm_SmallContent6', path.join(folderPath, afn(ssFile, 'Race')))
        .pushToSheets('#placeHolderForm_GridViewTabularContentArea7', 'Ethnicity', sheets)
        .existCrop('#placeHolderForm_SmallContent7', path.join(folderPath, afn(ssFile, 'Ethnicity')))
        .pushToSheets('#placeHolderForm_GridView8', 'By the Numbers', sheets)
        .existCrop('#placeHolderForm_XLargeContent8', path.join(folderPath, afn(ssFile, 'Numbers')))
        .pushToSheets('#placeHolderForm_GridView9', 'Average Annual Incidence of Confirmed Infections by Site', sheets)
        .existCrop('#placeHolderForm_XLargeContent9', path.join(folderPath, afn(ssFile, 'Average')))
        .do(function (done) {
            createXlsx(sheets, path.join(folderPath, dataFile), done);
        })
        .screenshot(path.join(folderPath, ssFile))
        .close();
};

/**
 * Run immediately on script load to determine available actions and attempt to run the specified action
 */
(function () {
    // setting combination too use program
    var opts = [
        {
            year: {start: 2000, end: 2016},
            ages: [1, 2],
            pathogen: [78],
            ssFile: null,
            dataFile: null
        },
        {
            year: {start: 1996, end: 2016},
            ages: [],
            pathogen: [],
            ssFile: null,
            dataFile: null
        },
        {
            year: {start: 2000, end: 2016},
            ages: [],
            pathogen: [],
            ssFile: null,
            dataFile: null
        }
    ];
    for (var i = 0; i < opts.length; i++) {
        main(opts[i], i);
    }
})();