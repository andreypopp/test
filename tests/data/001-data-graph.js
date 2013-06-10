(function(root) {

var _ = root._;
var assert = root.Substance.assert;
var Substance = root.Substance;

var test = {};


// Graph operations
// ================
//
// Message format
// [:opcode, :target, :data] where opcodes can be overloaded for different types, the type is determined by the target (can either be a node or node.property),
//                           data is an optional hash
//
// Node operations
// --------
// create heading node
// ["create", {id: "h1", type: "heading", "content": "Hello World" } ]
//
// internal representation:
// { op: "create", path: [], args: {id: "h1", type: "heading", "content": "Hello World" } }
//
// delete node
// ["delete", {"id": "t1"}]

// String operations
// ---------
//
// update content (String OT)
// ["update", "h1", "content", [-1, "ABC", 4]]
//
// reverse (joking)
// ["reverse", "h1", "content"]


// Number operations
// ---------
//
// update content (String OT)
// ["increment", "h1.level"]
//


// Array operations
// ---------------

// Push new value to end of array
// ["push", "content_view.nodes", {value: "new-entry"}]
//
// Delete 1..n elements
// ["delete", "content_view.nodes", {values: ["v1", "v2"]}]

// Insert element at position index
// ["insert", "content_view.nodes", {value: "newvalue", index: 3}]


var SCHEMA = {
  "views": {
    // Stores order for content nodes
    "content": {
    }
  },

  // static indexes
  "indexes": {
    // all comments are now indexed by node association
    "comments": {
      "type": "comment",
      "properties": ["node"]
    },
    // All comments are now indexed by node
    "annotations": {
      "type": "annotation", // alternatively [type1, type2]
      "properties": ["node"]
    }
  },

  "types": {
    // Specific type for substance documents, holding all content elements
    "content": {
      "properties": {

      }
    },
    "text": {
      "parent": "content",
      "properties": {
        "content": "string"
      }
    },

    "document": {
      "properties": {
        "views": "array"
      }
    },

    "view": {
      "properties": {
        "nodes": "array"
      }
    },

    "code": {
      "parent": "content",
      "properties": {
        "content": "string"
      }
    },
    "image": {
      "parent": "content",
      "properties": {
        "large": "string",
        "medium": "string",
        "caption": "string"
      }
    },
    "heading": {
      // TODO: this has been duplicate
      // "parent": "node",
      "properties": {
        "content": "string",
        "level": "number"
      },
      "parent": "content"
    },
    // Annotations
    "annotation": {
      "properties": {
        "node": "node",
        "pos": "object"
      }
    },
    "strong": {
      "properties": {
        "node": "string", // should be type:node
        "pos": "object"
      },
      "parent": "annotation"
    },
    "emphasis": {
      "properties": {
        "node": "string", // should be type:node
        "pos": "object"
      },
      "parent": "annotation"
    },
    "inline-code": {
      "parent": "annotation",
      "properties": {
        "node": "string", // should be type:node
        "pos": "object"
      }
    },
    "link": {
      "parent": "annotation",
      "properties": {
        "node": "string", // should be type:node
        "pos": "object",
        "url": "string"
      }
    },
    "idea": {
      "parent": "annotation",
      "properties": {
        "node": "string", // should be type:node
        "pos": "object",
        "url": "string"
      }
    },
    "error": {
      "parent": "annotation",
      "properties": {
        "node": "string", // should be type:node
        "pos": "object",
        "url": "string",
      }
    },
    "question": {
      "parent": "annotation",
      "properties": {
        "node": "string", // should be type:node
        "pos": "object",
        "url": "string"
      }
    },
    // Comments
    "comment": {
      "properties": {
        "content": "string",
        "node": "node"
      }
    }
  }
};

test.setup = function() {
  this.graph = new Substance.Data.Graph(SCHEMA);
};

test.actions = [

  "Create a new document node", function() {
    var op = ["create", {
        "id": "document",
        "type": "document",
        "views": ["content", "figures"]
      }
    ];

    this.graph.exec(op);
    assert.isArrayEqual(["content", "figures"], this.graph.get('document').views);
  },

  "Create content view", function() {

    var op = ["create", {
        "id": "content",
        "type": "view",
        "nodes": []
      }
    ];

    this.graph.exec(op);
    assert.isTrue(_.isArray(this.graph.get('content').nodes));
  },

  "Create a new heading node", function() {
    var op = ["create", {
        "id": "h1",
        "type": "heading",
        "content": "Heading 1"
      }
    ];

    this.graph.exec(op);
    assert.isEqual(op[1].content, this.graph.get('h1').content);
  },

  "Add heading node to content view", function() {
    var op = [
      "push", "content", "nodes", {"value": "h1"}
    ];
    this.graph.exec(op);
    assert.isArrayEqual(["h1"], this.graph.get('content').nodes);
  },

  "Update heading content", function() {
    var op = [
      "update", "h1", "content", ["+", 3, "bla"]
    ];
    this.graph.exec(op);
    assert.isEqual("Heablading 1", this.graph.get("h1").content);
  },

  "Create a text node", function() {
    var op = ["create", {
        "id": "text1",
        "type": "text",
        "content": "This is text1."
      }
    ];

    this.graph.exec(op);
    assert.isEqual(op[1].content, this.graph.get('text1').content);
  },

  "Add 'text1' to 'content' view", function() {
    var op = [
      "update", "content", "nodes", ["+", 1, "text1"]
    ];
    this.graph.exec(op);
    assert.isArrayEqual(["h1", "text1"], this.graph.get("content").nodes);
  },

  "Move 'text1'", function() {
    var op = [
      "update", "content", "nodes", [">>", 1, 0]
    ];
    this.graph.exec(op);
    assert.isArrayEqual(["text1", "h1"], this.graph.get("content").nodes);
  },

];

root.Substance.registerTest(['Data', 'Data Graph Manipulation'], test);

})(this);
