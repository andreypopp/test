(function(root) {

var _ = root._;
var assert = root.Substance.assert;
//var util = root.Substance.util;
var Document = root.Substance.Document;
var Session = root.Substance.Session;
var Data = root.Substance.Data;

var test = {};

test.setup = function() {
  this.session = Substance.session;
  this.session.createDocument();
  this.doc = this.session.document;

  this.doc.exec(Data.Graph.Create({
    "id": "t1",
    "type": "text",
    "content": "The quick brown fox jumps over the lazy dog."
  }));

  this.doc.exec(Data.Graph.Create({
    "id": "t2",
    "type": "text",
    "content": "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
  }));

  this.doc.exec(["position", "content", {"nodes": ["t1", "t2"], "target": -1}]);
};

test.actions = [

  "Select text in a single text node", function() {
    var selection = this.doc.select({start: [0, 4], end: [0, 9]});
    // assert.isEqual(selection, this.doc.selection);
    assert.isEqual(1, selection.getNodes().length);
    assert.isEqual("quick", selection.getText());
  },

  "Select text spanning over multiple text nodes", function() {
    var selection = this.doc.select({start: [0, 4], end: [1, 11]});
    // assert.isEqual(selection, this.doc.selection);
    assert.isEqual(2, selection.getNodes().length);
    assert.isEqual("quick brown fox jumps over the lazy dog.Lorem ipsum", selection.getText());
  },

  "Break node into pieces", function() {
    var selection = this.doc.select({start: [0, 4], end: [0, 4]});
    this.doc.insertNode("text");

    // Original node
    var contentView = this.doc.get('content').nodes;
    assert.isEqual(4, contentView.length);

    var t1a = this.doc.get(contentView[0]);
    var tnew = this.doc.get(contentView[1]);
    var t1b = this.doc.get(contentView[2]);

    // New node
    assert.isEqual("The ", t1a.content);
    assert.isEqual("text", tnew.type);
    assert.isEqual("", tnew.content);

    assert.isEqual("quick brown fox jumps over the lazy dog.", t1b.content);
    assert.isEqual("text", t1b.type);

    assert.isEqual("", selection.getText());

  },

  "Type some new text into new node", function() {
    // Now you probably want to place the cursor at position 0 of the newly created node
    this.doc.select({start: [1, 0], end: [1,0]});

    // only one selected node
    assert.isEqual(1, this.doc.selection.getNodes().length);

    // Pull out the fresh node to be updated
    this.freshNode = this.doc.selection.getNodes()[0];
  
    console.log('node', this.freshNode);
    var op = [
      "update", this.freshNode.id, "content", ["Hello World!"]
    ];

    this.doc.exec(op);
    assert.isEqual("Hello World!", this.freshNode.content);
  },


  "Cut selection spanning over multiple text nodes", function() {
    // var nodes = this.doc.query(['content', 'nodes']);
    // console.log(nodes);
    
    // Current state
    // t1a: "The "
    // tnew: "Hello World!"
    // t1b: "quick brown fox jumps over the lazy dog."
    // t2: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
    this.doc.select({start: [0, 3], end: [2, 11]});

    assert.isEqual(3, this.doc.selection.getNodes().length);

    // Check selection
    assert.isEqual(" Hello World!quick brown", this.doc.selection.getText());

    // Stores the cutted document in this.doc.clipboard
    this.doc.cutSelection();

    // Desired new contents
    // t1a: "The"
    // t1b: " fox jumps over the lazy dog."
    // t2: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."

    var contentView = this.doc.get('content').nodes;
    // assert.isEqual(3, contentView.length);

    var t1a = this.doc.get(contentView[0]);
    assert.isEqual("The ", this.doc.get(contentView[0]).content);

    return;
    // assert.isEqual(" fox jumps over the lazy dog.", this.doc.get(contentView[1]).content);
    // assert.isEqual("Lorem ipsum dolor sit amet, consectetur adipiscing elit.", this.doc.get(contentView[2]).content);

    // assert.isEqual("The fox jumps over the lazy dog.Lorem ipsum dolor sit amet, consectetur adipiscing elit.", this.doc);

    // Clipboard
    // t1: " "
    // t2: "Hello World!"
    // t3: "quick brown"

    var clipboardContent = this.doc.clipboard.get('content').nodes;
    assert.isEqual(3, clipboardContent.length);

    var t1a = this.doc.get(clipboardContent[0]);
    assert.isEqual(" ", this.doc.get(clipboardContent[0]).content);
    assert.isEqual("Hello World", this.doc.get(clipboardContent[1]).content);
    assert.isEqual("quick brown", this.doc.get(clipboardContent[2]).content);

    // make a new selection (place selction over "Lorem ipsum")
    // which will be replaced by the clipboard's contents
    this.doc.select({start: [2,0], end: [2,10]});
    
    this.doc.pasteClipboard();

    // Desired new contents
    // t1a:   "The"
    // t1b:   " fox jumps over the lazy dog."
    // t2:    "Lorem ipsum "
    // tnew:  "Hello World!"
    // tnew2: "quick browndolor sit amet, consectetur adipiscing elit."


    console.log('nodes', selection.getText());

    // var selection = this.doc.select({start: [0, 4], end: [1, 11]});
    // // assert.isEqual(selection, this.doc.selection);
    // assert.isEqual(2, selection.getNodes().length);
    // assert.isEqual("quick brown fox jumps over the lazy dog.Lorem ipsum", selection.getText());
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
