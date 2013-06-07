(function(root) {

var _ = root._;
var assert = root.Substance.assert;
var util = root.Substance.util;
var Document = root.Substance.Document;

var test = {};

test.actions = [
  "Initialization", function() {
    this.doc = new Document({"id": "substance-doc"});
  },

  "Create heading", function() {
    var op = [
      "insert",
      {
        "id": "heading:1",
        "type": "heading",
        "target": "back",
        "data": {
          "content": "Heading 1"
        }
      }
    ];

    this.doc.exec(op);
    assert.isArrayEqual(["heading:1"], this.doc.views['content']);
  },

  "Create text element", function() {
    var op = [
      "insert",
      {
        "id": "text:1",
        "type": "text",
        "target": "heading:1",
        "data": {
          "content": "Text 1"
        }
      }
    ];

    this.doc.exec(op);
    assert.isArrayEqual(["heading:1", "text:1"], this.doc.views['content']);
  },

  "Insert using 'front' and 'back' keywords", function() {

    var op1 = [
      "insert",
      {
        "id": "text:2",
        "type": "text",
        "target": "front",
        "data": {
          "content": "Text 2"
        }
      }
    ];

    var op2 = [
      "insert",
      {
        "id": "text:3",
        "type": "text",
        "target": "back",
        "data": {
          "content": "Text 3"
        }
      }
    ];

    this.doc.exec(op1);
    assert.isArrayEqual(["text:2", "heading:1", "text:1"], this.doc.views['content']);

    this.doc.exec(op2);
    assert.isArrayEqual(["text:2", "heading:1", "text:1", "text:3"], this.doc.views['content']);
  },

  "Move operation", function() {
    var op = [
      "move",
      {
        "nodes": ["text:2", "heading:1"],
        "target": "text:1"
      }
    ];

    this.doc.exec(op);
    assert.isArrayEqual(["text:1", "text:2", "heading:1", "text:3"], this.doc.views['content']);
  },

  "Create a comment", function() {
    var op = [
      "insert",
      {
        "id": "comment:1",
        "type": "comment",
        "data": {
          "node": "text:1",
          "content": "Comment 1"
        }
      }
    ];

    this.doc.exec(op);

    // Get comments for text:1
    var comments = this.doc.find("comments", "text:1");
    assert.equal(comments.length, 1);
    assert.equal(comments[0].id, "comment:1");
  },

  "Create an annotation", function() {
    var op = [
      "insert",
      {
        "id": "annotation:1",
        "type": "idea",
        "data": {
          "node": "text:1",
          "pos": [1, 4]
        }
      }
    ];

    this.doc.exec(op);

    // Get annotations for text:1
    var annotations = this.doc.find("annotations", "text:1");
    assert.equal(annotations.length, 1);
    assert.equal(annotations[0].id, "annotation:1");

  },

  "Test indexing", function() {

    // Create a comment that sticks on the annotation
    var op = [
      "insert",
      {
        "id": "comment:2",
        "type": "comment",
        "data": {
          "node": "annotation:1",
          "content": "Hello world"
        }
      }
    ];

    this.doc.exec(op);
    console.log("this.doc.indexes", util.deepclone(this.doc.indexes));

    // Get comments for annotation:1
    comments = this.doc.find("comments", "annotation:1");
    assert.equal(comments.length, 1);
    assert.equal(comments[0].id, "comment:2");

  },

  "Delete some comments", function() {
    var op = [
      "delete",
      {
        "nodes": ["comment:1", "comment:2"]
      }
    ];

    // Delete element, then check indexes again
    this.doc.exec(op);

    // Get comments for annotation:1
    var comments = this.doc.find("comments", "annotation:1");
    assert.equal(comments.length, 0);

  },

  "Iteration", function() {
    var count = 0;
    this.doc.each(function() {
      count++;
    });

    assert.equal(count, 4);
    console.log(this.doc);
  },

  // "Update Annotation", function() {
  //   var op = [
  //     "update",
  //     {
  //       "id": "annotation:1",
  //       "type": "idea",
  //       "data": {
  //         "node": "text:2"
  //       }
  //     }
  //   ];

  //   this.doc.apply(op);

  //   // Annotation no longer sticks on text:1
  //   var annotations = this.doc.find('annotations', 'text:1');
  //   assert.equal(annotations.length, 0);

  //   // Should be returned when querying for annotations, text:2
  //   annotations = this.doc.find('annotations', 'text:2');
  //   assert.equal(annotations.length, 1);
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
