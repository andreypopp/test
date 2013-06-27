(function(root) {

var _ = root._;
var assert = root.Substance.assert;
var Substance = root.Substance;
var Data = root.Substance.Data;
var ot = root.Substance.Chronicle.ot;

var test = {};

// TODO: maybe we should test the graph more thoroughly with a dedicated schema
var SCHEMA1 = {
  types: {
    elem: {
      properties: {
        obj: "object",
        arr: "array",
        str: "string",
        num: "number",
        flag: "boolean",
        time: "date",
      }
    },
  },
};

var SCHEMA2 = {
  types: {
    node: {
      properties: {
        name: "string",
      }
    },
    strings: {
      parent: "node",
      properties: {
        val: ["string"],
        arr: ["array", "string"]
      }
    },
    numbers: {
      parent: "node",
      properties: {
        val: ["number"],
        arr: ["array", "number"]
      }
    },
    booleans: {
      parent: "node",
      properties: {
        val: ["boolean"],
        arr: ["array", "boolean"]
      }
    },
    dates: {
      parent: "node",
      properties: {
        val: ["date"],
        arr: ["array", "date"]
      }
    },
    custom: {
      parent: "node",
      properties: {
        val: ["object"],
      }
    },
  },
};

var SCHEMA3 = {
  indexes : {
    "all": {
      "type": "node",
    },
    "foos": {
      "type": "foo",
    },
    "bars": {
      "type": "bar",
    },
    "by_category": {
      "type": "node",
      "properties": ["category"]
    }
  },
  types: {
    node: {
      properties: {
        category: "string"
      }
    },
    foo: {
      parent: "node"
    },
    bar: {
      parent: "node"
    }
  }
};

test.fixture1 = function() {
  this.graph = new Substance.Data.Graph(SCHEMA1);
  this.schema = this.graph.schema;
};

test.fixture2 = function() {
  this.graph = new Substance.Data.Graph(SCHEMA2);
  this.schema = this.graph.schema;
};

test.fixture3 = function() {
  this.fixture2();

  this.graph.exec(Data.Graph.Create({
    id: "the_strings",
    type: "strings",
    name: "Strings",
    val: "foo",
    arr: ["bla","blupp"]
  }));

  this.graph.exec(Data.Graph.Create({
    id: "the_numbers",
    type: "numbers",
    name: "Numbers",
    val: 11,
    arr: [1,2,3]
  }));

  this.graph.exec(Data.Graph.Create({
    id: "the_booleans",
    type: "booleans",
    name: "Booleans",
    val: true,
    arr: [false, true]
  }));

  this.graph.exec(Data.Graph.Create({
    id: "the_dates",
    type: "dates",
    name: "Dates",
    val: new Date(1000),
    arr: [new Date(1000),new Date(2000)]
  }));

  this.graph.exec(Data.Graph.Create({
    id: "the_custom",
    type: "custom",
    name: "Custom",
    val: { a: { foo: "bar"}, bla: "blupp" },
  }));

};

test.fixture4 = function() {
  this.graph = new Substance.Data.Graph(SCHEMA3);
  this.schema = this.graph.schema;
};

function getIds(arr) {
  return _.map(arr, function(n) { return n.id; });
}

test.actions = [
  "Load Fixture 1", function() {
    this.fixture1();
  },

  "Schema: defaultValue", function() {

    assert.isObjectEqual({}, this.schema.defaultValue("object"));
    assert.isArrayEqual([], this.schema.defaultValue("array"));
    assert.isEqual("", this.schema.defaultValue("string"));
    assert.isEqual(0, this.schema.defaultValue("number"));
    assert.isEqual(false, this.schema.defaultValue("boolean"));
    // can only check if a default date is given
    assert.isDefined(this.schema.defaultValue("date"));
  },

  "Schema: parseValue", function() {
    assert.isObjectEqual({a: "bla"}, this.schema.parseValue("object", '{"a": "bla"}'));
    assert.isArrayEqual([1,2,3], this.schema.parseValue("array", '[1,2,3]'));
    assert.isEqual("bla", this.schema.parseValue("string", 'bla'));
    assert.isEqual(42, this.schema.parseValue("number", '42'));
    assert.isEqual(true, this.schema.parseValue("boolean", 'true'));
    var expected = new Date(Date.now());
    var parsedDate = this.schema.parseValue("date", expected.toISOString());
    assert.isEqual(expected.getTime(), parsedDate.getTime());
  },

  "Schema: properties", function() {
    var props = this.schema.properties("elem");
    assert.isObjectEqual(SCHEMA1.types.elem.properties, props);
    // props should be a copy
    props["ooooh"] = "aaaaahh";
    assert.isFalse(_.isEqual(SCHEMA1.types.elem.properties, props));
  },

  "Load Fixture 2", function() {
    this.fixture2();
  },

  "Schema: inheritance - type chain", function() {
    var chain = this.schema.typeChain("numbers");
    assert.isArrayEqual(["node", "numbers"], chain);
  },

  "Schema: inheritance - properties", function() {
    var expected = _.extend({}, SCHEMA2.types.node.properties, SCHEMA2.types.numbers.properties);
    var actual = this.schema.properties("numbers");
    assert.isObjectEqual(expected, actual);
  },

  "Schema: composite types", function() {
    var expected = ["array", "number"];
    var actual = this.schema.propertyType("numbers", "arr");
    assert.isArrayEqual(expected, actual);
  },

  "Graph: create", function() {
    var node = {
      id: "n1",
      type: "numbers",
      name: "Numbers 1",
      foo: "bar",
      val: 11,
      arr: [1,2,3]
    };
    var op = Data.Graph.Create(node);
    this.graph.exec(op);

    // the node should be accessible via id now
    var newNode = this.graph.get(node.id);
    assert.isDefined(newNode);

    assert.isEqual(node.name, newNode.name);
    assert.isEqual(node.val, newNode.val);
    assert.isArrayEqual(node.arr, newNode.arr);

    // the node is newly created
    node.bla = "blupp";
    assert.isUndefined(newNode.bla);

    // ... and values are deeply cloned
    node.arr.push(4);
    assert.isFalse(_.isEqual(node.arr, newNode.arr));

    // only properties that are specified in the schema should be copied
    assert.isUndefined(newNode.foo);
  },

  "Graph: create - 'id' and 'type' are mandatory", function() {
    var op = Data.Graph.Create({});
    assert.exception(function() {
      this.graph.exec(op);
    }, this);
  },

  "Graph: create - 'type' must be defined in schema", function() {
    var op = Data.Graph.Create({id: "aaa", type: "unknown_type"});
    assert.exception(function() {
      this.graph.exec(op);
    }, this);
  },

  "Graph: create should use default values for incomplete data", function() {
    var node = {
      id: "n2",
      type: "numbers",
    };
    var op = Data.Graph.Create(node);
    this.graph.exec(op);

    var newNode = this.graph.get(node.id);

    assert.isEqual("", newNode.name);
    assert.isEqual(0, newNode.val);
    assert.isArrayEqual([], newNode.arr);
  },

  "Graph: delete", function() {
    var id = "n1";
    var op = Data.Graph.Delete(this.graph.get(id));
    this.graph.exec(op);
    assert.isUndefined(this.graph.get(id));
  },

  "Graph: should reject duplicate creations", function() {
    var node = {
      id: "n2",
      type: "numbers",
    };
    var op = Data.Graph.Create(node);
    assert.exception(function() {
      this.graph.exec(op);
      this.graph.exec(op);
    }, this);
  },

  "Load Fixture 3", function() {
    // Load
    this.fixture3();
  },

  "Graph: update 'object'", function() {
    // Maybe it would be helpful to have some convenience mechanism
    // to create node property updates more easily

    var valueUpdate = ot.TextOperation.fromOT("bar", [1, -1, "e", 1, "ry"]);
    var propertyUpdate = ot.ObjectOperation.Update(["a", "foo"], valueUpdate);
    var nodeUpdate = Data.Graph.Update(["the_custom", "val"], propertyUpdate);
    this.graph.exec(nodeUpdate);

    var custom = this.graph.get("the_custom");
    assert.isEqual("berry", custom.val.a.foo);
  },

  "Graph: update 'array'", function() {
    var propertyUpdate = ot.ArrayOperation.Insert(3, 4);
    var nodeUpdate = Data.Graph.Update(["the_numbers", "arr"], propertyUpdate);
    this.graph.exec(nodeUpdate);

    var numbers = this.graph.get("the_numbers");
    assert.isArrayEqual([1,2,3,4], numbers.arr);
  },

  "Graph: update 'string'", function() {
    var propertyUpdate = ot.TextOperation.fromOT("foo", [3, "tball"]);
    var nodeUpdate = Data.Graph.Update(["the_strings", "val"], propertyUpdate);
    this.graph.exec(nodeUpdate);

    var strings = this.graph.get("the_strings");
    assert.isEqual("football", strings.val);
  },

  "Graph: update 'number'", function() {
    var nodeUpdate = Data.Graph.Set(["the_numbers", "val"], 42);
    this.graph.exec(nodeUpdate);

    var numbers = this.graph.get("the_numbers");
    assert.isEqual(42, numbers.val);
  },

  "Graph: update 'boolean'", function() {
    var nodeUpdate = Data.Graph.Set(["the_booleans", "val"], false);
    this.graph.exec(nodeUpdate);

    var booleans = this.graph.get("the_booleans");
    assert.isEqual(false, booleans.val);
  },

  "Graph: update 'date'", function() {
    var date = new Date(1111);
    var nodeUpdate = Data.Graph.Set(["the_dates", "val"], date);
    this.graph.exec(nodeUpdate);

    var dates = this.graph.get("the_dates");
    assert.isEqual(date.getTime(), dates.val.getTime());
  },

  "Load Fixture 4", function() {
    this.fixture4();
  },

  "Indexes: created nodes should be added to indexes", function() {
    this.graph.exec(Data.Graph.Create({
      id: "foo1",
      type: "foo",
      category: "bla"
    }));
    this.graph.exec(Data.Graph.Create({
      id: "bar1",
      type: "bar",
      category: "blupp"
    }));

    var all = getIds(this.graph.find("all"));
    assert.isArrayEqual(["foo1", "bar1"], all);

    var foos = getIds(this.graph.find("foos"));
    assert.isArrayEqual(["foo1"], foos);

    var bars = getIds(this.graph.find("bars"));
    assert.isArrayEqual(["bar1"], bars);

    var by_bla = getIds(this.graph.find("by_category", "bla"));
    assert.isArrayEqual(["foo1"], by_bla);

    var by_blupp = getIds(this.graph.find("by_category", "blupp"));
    assert.isArrayEqual(["bar1"], by_blupp);
  },

  "Indexes: deleted nodes should be removed from indexes", function() {
    this.graph.exec(Data.Graph.Delete(this.graph.get("foo1")));

    var all = getIds(this.graph.find("all"));
    assert.isArrayEqual(["bar1"], all);

    var foos = getIds(this.graph.find("foos"));
    assert.isArrayEqual([], foos);

    var bars = getIds(this.graph.find("bars"));
    assert.isArrayEqual(["bar1"], bars);

    var by_bla = getIds(this.graph.find("by_category", "bla"));
    assert.isArrayEqual([], by_bla);

    var by_blupp = getIds(this.graph.find("by_category", "blupp"));
    assert.isArrayEqual(["bar1"], by_blupp);
  },

  "Indexes: updates of indexed properties should update indexes", function() {
    this.graph.exec(Data.Graph.Set(["bar1", "category"], "bla"));
    assert.isArrayEqual(["bar1"], this.graph.indexes.all);
    assert.isArrayEqual([], this.graph.indexes.foos);
    assert.isArrayEqual(["bar1"], this.graph.indexes.bars);
    assert.isArrayEqual(["bar1"], this.graph.indexes.by_category.bla);
    assert.isUndefined(this.graph.indexes.by_category.blupp);
  },

];

root.Substance.registerTest(['Data', 'Graph'], test);

})(this);
