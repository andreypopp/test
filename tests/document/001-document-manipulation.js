(function(root) {

var _ = root._;
var assert = root.Substance.assert;
var util = root.Substance.util;
var Document = root.Substance.Document;
var Data = root.Substance.Data;

var test = {};

test.setup = function() {
  this.doc = new Document({"id": "substance-doc"});
};

test.actions = [
  "Initialization", function() {
    
  },

  "Check if valid document has been constructed", function() {    
    assert.isArrayEqual(["content", "figures", "publications"], this.doc.get('document').views);
    assert.isTrue(_.isArray(this.doc.get('content').nodes));
  },

  "Create a new heading node", function() {
    var op = ["create", {
        "id": "h1",
        "type": "heading",
        "content": "Heading 1"
      }
    ];

    this.doc.exec(op);
    assert.isEqual(op[1].content, this.doc.get('h1').content);
  },

  "Create a new text nodes", function() {
    var op = ["create", {
        "id": "t1",
        "type": "text",
        "content": "Text 1"
      }
    ];

    var op2 = ["create", {
        "id": "t2",
        "type": "text",
        "content": "Text 2"
      }
    ];

    this.doc.exec(op);
    this.doc.exec(op2);

    assert.isDefined(this.doc.get('t1'));
    assert.isDefined(this.doc.get('t2'));
  },

  // "Add nodes to content view", function() {
  //   var op = [
  //     "position", "content", {"nodes": ["t2", "h1", "t1"], "target": -1}
  //   ];
  //   this.doc.exec(op);
  //   assert.isArrayEqual(["t2", "h1", "t1"], this.doc.get('content').nodes);
  // },

  // "Add nodes to content view 2", function() {
  //   var op = [
  //     "position", "content", {"nodes": ["t2", "h1", "t1"], "target": -1}
  //   ];
  //   this.doc.exec(op);
  //   assert.isArrayEqual(["t2", "h1", "t1"], this.doc.get('content').nodes);
  // },

  // "Reposition nodes ", function() {
  //   var op = [
  //     "position", "content", {"nodes": ["h1", "t1", "t2"], "target": 0}
  //   ];
  //   this.doc.exec(op);
  //   assert.isArrayEqual(["h1", "t1", "t2"], this.doc.get('content').nodes);
  //   console.log('LES DOC', this.doc);
  // },

  "Update heading content", function() {
    var op = [
      "update", "h1", {
        "content": [4, "ING", -3]
      }
    ];

    // [3, "abcd", -4, ]
    // var op = ["update", "h1", {
    //   "content": ["+", 3, ""],
    //   "foo": "doink"
    // }];

    // var op = ["set", "h1", {
    //   "foo": "doink"
    // }]

    // var op = ["set", "h1", {
    //   "foo": "asdfsdf",
    //   "children": ["t1", "v1"]
    // }]

    this.doc.exec(op);

    assert.isEqual("HeadING 1", this.doc.get("h1").content);
  },

  "Update pos", function() {

  },

  "Create a comment", function() {

    var op = ["create", {
        "id": "c1",
        "type": "comment",
        "content": "Hi, I'm a comment",
        "source": "t1"
      }
    ];

    this.doc.exec(op);

    // Get comments for t1
    var comments = this.doc.find("comments", "t1");
    assert.equal(comments.length, 1);
    assert.equal(comments[0].id, "c1");
  },

  "Create an annotation", function() {

    //   var op = ["create", {
    //       "id": "a1",
    //       "type": "annotation",
    //       "pos": [1, 4],
    //       "node": "t1"
    //     }
    //   ];

    var op = ["annotate", "t1", "content", {
        "id": "a1",
        "type": "idea",
        // "source": ["t1", "content"]
        "pos": [1, 3]
      }
    ];

    this.doc.exec(op);

    console.log('LE DOC', this.doc);

    // Get annotations for text:1
    var annotations = this.doc.find("annotations", "t1");
    assert.equal(annotations.length, 1);
    assert.equal(annotations[0].id, "a1");

    // Pos of annotation should be 1, offset 4
    assert.isArrayEqual([1, 3], annotations[0].pos);
  },

  "Change text, which affects the annotation we just created", function() {
    var op = [
      "update", "t1", {
        "content": [1, "EEE"]
      }
    ];

    this.doc.exec(op);
    // assert.equal(annotations[0].id, "a1");
    assert.isEqual("TEEEext 1", this.doc.get('t1').content);
    assert.isArrayEqual([1, 6], this.doc.get('a1').pos);

  },

  "Change text, which affects the annotation we just created", function() {
    var op = [
      "update", "t1", {
        "content": [1, "EEE"]
      }
    ];

    this.doc.exec(op);
    // assert.equal(annotations[0].id, "a1");
    assert.isEqual("TEEEext 1", this.doc.get('t1').content);
    assert.isArrayEqual([1, 6], this.doc.get('a1').pos);
  },

  // "Stick comment to annotation", function() {
  //   // Create a comment that sticks on the annotation
  //   var op = ["create", {
  //       "id": "c2",
  //       "type": "comment", // TODO: consider moving that into data object
  //       "node": "a1",
  //       "content": "Hello world"
  //     }
  //   ];

  //   this.doc.exec(op);
  //   // console.log("this.doc.indexes", util.deepclone(this.doc.indexes));

  //   // Get comments for annotation:1
  //   comments = this.doc.find("comments", "a1");
  //   assert.equal(comments.length, 1);
  //   assert.equal(comments[0].id, "c2");

  // },

  // "Delete all comments", function() {
  //   var op = [
  //     "delete",
  //     {
  //       "nodes": ["c1", "c2"]
  //     }
  //   ];

  //   // Delete element, then check indexes again
  //   this.doc.exec(op);

  //   // Get comments for annotation:1
  //   var comments = this.doc.find("comments", "a1");
  //   assert.equal(comments.length, 0);
  //   assert.equal(undefined, this.doc.get('c1'));
  //   assert.equal(undefined, this.doc.get('c2'));
  //   assert.isDefined(this.doc.get('a1'));
  // },

  // "Iteration", function() {
  //   var count = 0;
  //   this.doc.each(function() {
  //     count++;
  //   }); 

  //   assert.equal(count, 4);
  //   console.log(this.doc);
  // },

  // "Update Annotation", function() {
  //   var op = [
  //     "update",
  //     {
  //       "id": "annotation:1",
  //       "data": {
  //         "node": "text:2"
  //       }
  //     }
  //   ];

  //   this.doc.exec(op);

  //   // Annotation no longer sticks on text:1
  //   var annotations = this.doc.find('annotations', 'text:1');
  //   assert.equal(annotations.length, 0);

  //   // Should be returned when querying for annotations, text:2
  //   annotations = this.doc.find('annotations', 'text:2');
  //   assert.equal(annotations.length, 1);
  // },

  // "Update Text by assigning new value", function() {
  //   var op = [
  //     "update",
  //     {
  //       "id": "text:1",
  //       "data": {
  //         "content": "Text Eins"
  //       }
  //     }
  //   ];

  //   this.doc.exec(op);
  //   assert.isEqual("Text Eins", this.doc.nodes["text:1"].content);
  // },

  // "Update numeric value of a heading", function() {
  //   var op = [
  //     "update",
  //     {
  //       "id": "heading:1",
  //       "data": {
  //         "level": 2
  //       }
  //     }
  //   ];

  //   this.doc.exec(op);
  //   assert.isEqual(2, this.doc.nodes["heading:1"].level);
  // },

  // "OT Updates for multiple properties", function() {
  //   var op = [
  //     "insert",
  //     {
  //       "id": "comment:3",
  //       "type": "comment",
  //       "data": {
  //         "node": "text:2",
  //         "content": "Doe"
  //       }
  //     }
  //   ];

  //   var op2 = [
  //     "update",
  //     {
  //       "id": "comment:3",
  //       "data": {
  //         "content": ["John ", 3]
  //       }
  //     }
  //   ];

  //   this.doc.apply(op);
  //   this.doc.apply(op2);

  //   var node = this.doc.nodes["comment:3"];
  //   assert.equal(node.content, "John Doe");

  // },

  // "Support objects as values", function() {

  //   var op = [
  //     "update",
  //     {
  //       "id": "annotation:1",
  //       "data": {
  //         "pos": [1,27]
  //       }
  //     }
  //   ];

  //   this.doc.apply(op);

  //   var node = this.doc.nodes["annotation:1"];
  //   assert.isTrue(_.isEqual(node.pos, [1, 27]));
  // },
];

root.Substance.registerTest(['Document', 'Document Manipulation'], test);

})(this);
