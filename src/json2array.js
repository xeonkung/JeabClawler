/**
 * Created by Xeonkung on 7/12/2017.
 */
flat = require('./flat');

module.exports = function (obj) {

    var sheet = "Sheet 1";
    var delimiter = ".";
    var filter = function() { return true;};
    var headings = null;

    var header_labels = [];
    var input = [];
    if (obj instanceof Array) {
        input = obj;
    }
    else {
        input.push(obj);
    }

    //build headers
    var headers = [];
    for ( var i = 0; i < input.length; i++ ) {
        var fo = flat(input[i], delimiter, filter);
        var keys = Object.keys(fo);
        for (var j = 0; j < keys.length; j++ ) {
            if ( headers.indexOf(keys[j]) < 0) {
                if ( headings && headings[keys[j]]) {
                    header_labels.push(headings[keys[j]]);

                }
                else {
                    header_labels.push(keys[j])
                }
                headers.push(keys[j]);
            }
        }
    }

    var col_count = header_labels.length;
    var row_count = 1;
    var data = [];
    data.push(header_labels);
    for ( var i = 0; i < input.length; i++ ) {
        var actual_data = [];
        var fo = flat(input[i], delimiter, filter);
        for (key in headers) {
            actual_data.push(fo[headers[key]]);
        }
        data.push(actual_data);
        row_count++;
    }
    return data;
};