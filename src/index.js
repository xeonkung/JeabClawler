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
    , mkdirp = require('mkdirp')
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
                return self.crop(selector, name);
            }
        });
};
var existSelectCrop = function (selectorV, name, selectorS, val, waitFn) {
    var self = this;
    return this
        .exists(selectorS)
        .then(function (r) {
            if (r) {

                return self
                    .select(selectorS, val)
                    .waitFor(waitFn, true)
                    .crop(selectorV, name);
            }
        });
};
var searchOption = function (options) {
    var _options = defaults(options, {
        year: {start: 1996, end: 2016},
        ages: [],
        pathogen: [],
    });
    var prop = this;
    if (_options.year.start != 1996) {
        prop = prop.select('#placeHolderForm_DropDownListBasicYearsFrom', _options.year.start)
            .waitForNextPage({timeout: 90000});
    }
    if (_options.year.end != 2016) {
        prop = prop.select('#placeHolderForm_DropDownListBasicYearsTo', _options.year.end)
            .waitForNextPage({timeout: 90000});
    }
    for (var i = 0; i < _options.ages.length; i++) {
        prop = prop.select('#placeHolderForm_DropDownListFilterAges', _options.ages[i])
            .waitForNextPage({timeout: 90000});
    }
    for (var i = 0; i < _options.pathogen.length; i++) {
        prop = prop.select('#placeHolderForm_DropDownListFilterPathogens', _options.pathogen[i])
            .waitForNextPage({timeout: 90000});
    }
    return prop;
}
Horseman.registerAction('pushToSheets', pushToSheets);
Horseman.registerAction('searchOption', searchOption);
Horseman.registerAction('existCrop', existCrop);
Horseman.registerAction('existSelectCrop', existSelectCrop);
var loadPhantomInstance = function () {

    var options = {
        loadImages: true,
        injectJquery: true,
        injectBluebird: true,
        webSecurity: true,
        ignoreSSLErrors: true,
        timeout: 90000,
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
    if (opts.folderName) {
        folderPath = path.join(folderPath, opts.folderName);
    }
    var dataFile = opts.dataName || 'data' + idx + '.xlsx';
    var ssFile = opts.ssName || 'ss' + idx + '.png';
    var phantomInstance = loadPhantomInstance();
    var sheets = [];

    if (!fs.existsSync(folderPath)) {
        mkdirp.sync(folderPath);
    }
    var onSelectSmallContent4Change = function () {
        window.SelectSmallContent4.change();
        return true;
    };
    var onSelectSmallContent5Change = function () {
        window.SelectSmallContent5.change();
        return true;
    };
    var onSelectSmallContent6Change = function () {
        window.SelectSmallContent6.change();
        return true;
    };
    var onSelectSmallContent7Change = function () {
        window.SelectSmallContent7.change();
        return true;
    };
    var onSelectXLargeContent8Change = function () {
        window.SelectXLargeContent8.change();
        return true;
    };
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
        .existCrop('#placeHolderForm_SmallContent4', path.join(folderPath, afn(ssFile, 'AgeInfections')))
        .existSelectCrop('#placeHolderForm_SmallContent4', path.join(folderPath, afn(ssFile, 'AgeHospitalizations')), '#placeHolderForm_SelectSmallContent4', 'bar4Hosp', onSelectSmallContent4Change)
        .existSelectCrop('#placeHolderForm_SmallContent4', path.join(folderPath, afn(ssFile, 'AgeDeaths')), '#placeHolderForm_SelectSmallContent4', 'bar4Death', onSelectSmallContent4Change)
        .existSelectCrop('#placeHolderForm_SmallContent4', path.join(folderPath, afn(ssFile, 'AgeOutbreak-associated')), '#placeHolderForm_SelectSmallContent4', 'bar4Otbrk', onSelectSmallContent4Change)
        .existSelectCrop('#placeHolderForm_SmallContent4', path.join(folderPath, afn(ssFile, 'AgeTravel-associated')), '#placeHolderForm_SelectSmallContent4', 'bar4Travel', onSelectSmallContent4Change)
        .pushToSheets('#placeHolderForm_GridViewTabularContentArea5', 'Sex', sheets)
        .existCrop('#placeHolderForm_SmallContent5', path.join(folderPath, afn(ssFile, 'SexInfections')))
        .existSelectCrop('#placeHolderForm_SmallContent5', path.join(folderPath, afn(ssFile, 'SexHospitalizations')), '#placeHolderForm_SelectSmallContent5', 'bar5Hosp', onSelectSmallContent5Change)
        .existSelectCrop('#placeHolderForm_SmallContent5', path.join(folderPath, afn(ssFile, 'SexDeaths')), '#placeHolderForm_SelectSmallContent5', 'bar5Death', onSelectSmallContent5Change)
        .existSelectCrop('#placeHolderForm_SmallContent5', path.join(folderPath, afn(ssFile, 'SexOutbreak-associated')), '#placeHolderForm_SelectSmallContent5', 'bar5Otbrk', onSelectSmallContent5Change)
        .existSelectCrop('#placeHolderForm_SmallContent5', path.join(folderPath, afn(ssFile, 'SexTravel-associated')), '#placeHolderForm_SelectSmallContent5', 'bar5Travel', onSelectSmallContent5Change)
        .pushToSheets('#placeHolderForm_GridViewTabularContentArea6', 'Race', sheets)
        .existCrop('#placeHolderForm_SmallContent6', path.join(folderPath, afn(ssFile, 'RaceInfections')))
        .existSelectCrop('#placeHolderForm_SmallContent6', path.join(folderPath, afn(ssFile, 'RaceHospitalizations')), '#placeHolderForm_SelectSmallContent6', 'bar6Hosp', onSelectSmallContent6Change)
        .existSelectCrop('#placeHolderForm_SmallContent6', path.join(folderPath, afn(ssFile, 'RaceDeaths')), '#placeHolderForm_SelectSmallContent6', 'bar6Death', onSelectSmallContent6Change)
        .existSelectCrop('#placeHolderForm_SmallContent6', path.join(folderPath, afn(ssFile, 'RaceOutbreak-associated')), '#placeHolderForm_SelectSmallContent6', 'bar6Otbrk', onSelectSmallContent6Change)
        .existSelectCrop('#placeHolderForm_SmallContent6', path.join(folderPath, afn(ssFile, 'RaceTravel-associated')), '#placeHolderForm_SelectSmallContent6', 'bar6Travel', onSelectSmallContent6Change)
        .pushToSheets('#placeHolderForm_GridViewTabularContentArea7', 'Ethnicity', sheets)
        .existCrop('#placeHolderForm_SmallContent7', path.join(folderPath, afn(ssFile, 'EthnicityInfections')))
        .existSelectCrop('#placeHolderForm_SmallContent7', path.join(folderPath, afn(ssFile, 'EthnicityHospitalizations')), '#placeHolderForm_SelectSmallContent7', 'bar7Hosp', onSelectSmallContent7Change)
        .existSelectCrop('#placeHolderForm_SmallContent7', path.join(folderPath, afn(ssFile, 'EthnicityDeaths')), '#placeHolderForm_SelectSmallContent7', 'bar7Death', onSelectSmallContent7Change)
        .existSelectCrop('#placeHolderForm_SmallContent7', path.join(folderPath, afn(ssFile, 'EthnicityOutbreak-associated')), '#placeHolderForm_SelectSmallContent7', 'bar7Otbrk', onSelectSmallContent7Change)
        .existSelectCrop('#placeHolderForm_SmallContent7', path.join(folderPath, afn(ssFile, 'EthnicityTravel-associated')), '#placeHolderForm_SelectSmallContent7', 'bar7Travel', onSelectSmallContent7Change)
        .pushToSheets('#placeHolderForm_GridView8', 'By the Numbers', sheets)
        .existCrop('#placeHolderForm_XLargeContent8', path.join(folderPath, afn(ssFile, 'NumbersInfections')))
        .existSelectCrop('#placeHolderForm_XLargeContent8', path.join(folderPath, afn(ssFile, 'NumbersInfections')), '#placeHolderForm_SelectXLargeContent8', 'bar8', onSelectXLargeContent8Change)
        .existSelectCrop('#placeHolderForm_XLargeContent8', path.join(folderPath, afn(ssFile, 'NumbersHospitalizations')), '#placeHolderForm_SelectXLargeContent8', 'hosp8', onSelectXLargeContent8Change)
        .existSelectCrop('#placeHolderForm_XLargeContent8', path.join(folderPath, afn(ssFile, 'NumbersDeaths')), '#placeHolderForm_SelectXLargeContent8', 'dead8', onSelectXLargeContent8Change)
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
            year: {start: 1996, end: 2016},
            ages: [],
            pathogen: [],
            dataName: 'dataFile.xlsx',
            ssName: 'ssFile.png',
            folderName: './a/b/c/d'
        }
    ];
    for (var i = 0; i < opts.length; i++) {
        main(opts[i], i);
    }
})();