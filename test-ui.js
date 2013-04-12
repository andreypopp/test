function loadTests() {
  _.each(Substance.tests, function(test, name) {
    Substance.loadTest(name);
  });
}

function runTest(name, test) {
  var selTest = '.testcase#'+name;
  var selResult = selTest+" .result";
  var selOutput = selTest+" .output";
  $(selResult).hide();
  $(selOutput).hide();
  test.run(function(err) {
    if(err) {
      $(selResult).text("Failed").removeClass("success").addClass("fail").show();
      $(selOutput).text(err.toString()).show();
      //console.log("Test failed:" + err);
    } else {
      $(selResult).text("Ok").removeClass("fail").addClass("success").show();
      //console.log("Test succeeded.");
    }
  });
}

function createTestUI() {
  var body = $('body');
  _.each(Substance.tests, function(test, name) {
    var testCaseElem = $('<div id="'+name+'" class="testcase"></div>');
    var label = $('<div>'+name+'</div>');
    var button = $('<div class="button">Run</div>');
    var result = $('<div class="result"></div>');
    var output = $('<div class="output"></div>');

    button.click(function() { runTest(name, test); } );

    testCaseElem.append(label)
    testCaseElem.append(button)
    testCaseElem.append(result)
    testCaseElem.append(output);

    body.append(testCaseElem);
  });
}

loadTests();

