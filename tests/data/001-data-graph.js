(function(root) {

var _ = root._;
var assert = root.Substance.assert;
var util = root.Substance.util;

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
// ["create", "h1", {"type": heading, "content": "Hello World"}]
// 
// delete node
// ["delete", "h1"]

// String operations
// ---------
// 
// update content (String OT)
// ["update", "h1.content", [-1, "ABC", 4]]
// 
// reverse (joking)
// ["reverse", "h1.content"]


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


test.actions = [
  "Initialization", function() {
    // this.doc = new Document({"id": "substance-doc"});
    this.graph = new Data.Graph(SCHEMA);
    console.log('initializing...');
  },

  "Create a new document node", function() {
    var op = {
      "op": "create",
      "id": "document",
      "type": "document",
      "data": {
        "views": ["content", "figures"]
      }
    };

    // this.doc.exec(op);
    this.graph.exec(op);
    // assert.isArrayEqual(["heading:1"], this.doc.views['content']);
  },

  "Create content view", function() {
    var op = {
      "op": "create",
      "id": "content",
      "type": "view",
      "data": {
        "nodes": []
      }
    };
    
    // this.doc.exec(op);
    this.graph.exec(op);
    // assert.isArrayEqual(["heading:1"], this.doc.views['content']);
  },

  "Create a new text node", function() {
    var op = {
      "op": "create",
      "id": "h1",
      "type": "heading",
      "data": {
        "content": "Heading 1"
      }
    };
    // this.doc.exec(op);
    this.graph.exec(op);
    // assert.isArrayEqual(["heading:1"], this.doc.views['content']);
  }, 

  "Add text node to content view", function() {
    var op = [
      "push", "content.nodes", {"value": "h1"}
    ];

    // this.doc.exec(op);
    this.graph.exec(op);
    // assert.isArrayEqual(["heading:1"], this.doc.views['content']);
  },



];

root.Substance.registerTest(['Data', 'Data Graph Manipulation'], test);

})(this);
