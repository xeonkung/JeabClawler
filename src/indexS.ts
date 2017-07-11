/**
 * Created by Xeonkung on 7/11/2017.
 */
import phantomjs from 'phantomjs-prebuilt';

// function waitFor(testFx, onReady, timeOutMillis?) {
//     let maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000, //< Default Max Timout is 3s
//         start = new Date().getTime(),
//         condition = false,
//         interval = setInterval(function() {
//             if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
//                 // If not time-out yet and condition not yet fulfilled
//                 condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
//             } else {
//                 if(!condition) {
//                     // If condition still not fulfilled (timeout but condition is 'false')
//                     console.log("'waitFor()' timeout");
//                     phantom.exit(1);
//                 } else {
//                     // Condition fulfilled (timeout and/or condition is 'true')
//                     console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
//                     typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
//                     clearInterval(interval); //< Stop this interval
//                 }
//             }
//         }, 250); //< repeat check every 250ms
// };

childProcess

(async function (){
    const instance = await phantom.create();
    const page = await instance.createPage();
    await page.on("onResourceRequested", function(requestData: any) {
        console.info('Requesting', requestData.url)
    });

    const status = await page.open('https://wwwn.cdc.gov/foodnetfast/');
    console.log(status);
    await page.evaluate(function() {
        $('#ui-id-3').click();
    });
    waitFor(function () {
        return page.evaluate(function () {
            return $("#ui-id-4").is(":visible");
        });
    },function () {
        page.render('foodnetfast.png');
    });
    await instance.exit();
}());