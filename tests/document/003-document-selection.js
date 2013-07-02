
(function(root) {

var _ = root._;
var assert = root.Substance.assert;
//var util = root.Substance.util;
var Document = root.Substance.Document;
var Session = root.Substance.Session;
var Data = root.Substance.Data;

var test = {};

test.setup = function() {
  // this.doc = new Session.Document({
  //   id: "substance-doc",
  //   creator: "michael",
  //   created_at: new Date()
  // });
  this.session = Substance.session;
  this.session.createDocument();
  this.doc = this.session.document;

  this.doc.exec(Data.Graph.Create({
    "id": "t1",
    "type": "text",
    "content": "The quick brown fox jumps over the lazy dog."
  }));

  this.doc.exec(["position", "content", {"nodes": ["t1"], "target": -1}]);
};

test.actions = [

  "Select text in a single text node", function() {

    var selection = new Document.Range({
      "start": [0, 4],
      "end": [0, 9]
    });

    this.doc.select(selection);
    // assert.isEqual(selection, this.doc.selection);
    assert.isEqual(1, selection.getNodes(this.doc).length);
    assert.isEqual("quick", selection.getText(this.doc));
  },

  "Break node into pieces", function() {
    var selection = {
      "start": [0,4],
      "end": [0,4]
    };

    this.doc.select(selection);
    this.doc.insertNode("text");

    // Original node
    var contentView = this.get('content').nodes;
    var t1 = this.get(contentView[0]);
    var t2 = this.get(contentView[1]);
    var t3 = this.get(contentView[2]);

    // New node
    assert.isEqual("The ", t1.content);
    assert.isEqual("text", t2.type);
    assert.isEqual("", t2.content);

    assert.isEqual("quick brown fox jumps over the lazy dog.", t3.content);
    assert.isEqual("text", t3.type);

    assert.isEqual("", selection.getText());

  },


  // "Check if valid document has been constructed", function() {
  //   assert.isArrayEqual(["content", "figures", "publications"], this.doc.get('document').views);
  //   assert.isTrue(_.isArray(this.doc.get('content').nodes));
  // },

  // "Create a new heading node", function() {
  //   var op = ["create", {
  //       "id": "h1",
  //       "type": "heading",
  //       "content": "Heading 1"
  //     }
  //   ];

  //   this.doc.exec(op);
  //   assert.isEqual(op[1].content, this.doc.get('h1').content);

  //   // h1.level should be automatically initialized with 0
  //   // TODO: should default to null later, once we support null values
  //   assert.isEqual(0, this.doc.get('h1').level);
  // },



];

root.Substance.registerTest(['Document', 'Document Selection'], test);

})(this);
