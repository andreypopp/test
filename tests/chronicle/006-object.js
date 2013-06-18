(function(root) {

var assert = root.Substance.assert;
var util = root.Substance.util;
var errors = root.Substance.errors;
var Chronicle = root.Substance.Chronicle;
var ObjectOperation = Chronicle.OT.ObjectOperation;

function testTransform(a, b, input, expected) {
  var t = ObjectOperation.transform(a, b);

  var output = ObjectOperation.apply(t[1], ObjectOperation.apply(a, util.clone(input)));
  assert.isObjectEqual(expected, output);

  output = ObjectOperation.apply(t[0], ObjectOperation.apply(b, util.clone(input)));
  assert.isObjectEqual(expected, output);
}

var ObjectOperationTest = function() {

  this.actions = [

    "Apply: create", function() {
      var path = ["a"];
      var val = "bla";
      var expected = {a: "bla"};
      var op = ObjectOperation.Create(path, val);

      var obj = {};
      op.apply(obj);

      assert.isObjectEqual(expected, obj);
    },

    "Apply: create (nested)", function() {
      var path = ["a", "b"];
      var val = "bla";
      var expected = {a: { b: "bla"} };
      var op = ObjectOperation.Create(path, val);

      var obj = {};
      op.apply(obj);

      assert.isObjectEqual(expected, obj);
    },

    "Apply: delete", function() {
      var path = ["a"];
      var val = "bla";
      var op = ObjectOperation.Delete(path, val);
      var expected = {};

      var obj = {"a": "bla"};
      op.apply(obj);

      assert.isObjectEqual(expected, obj);
    },

    "Apply: delete (nested)", function() {
      var path = ["a", "b"];
      var val = "bla";
      var op = ObjectOperation.Delete(path, val);
      var expected = { a: {} };

      var obj = { a: { b: "bla"} };
      op.apply(obj);

      assert.isObjectEqual(expected, obj);
    },

    "Apply: delete (key error)", function() {
      var path = ["a", "b"];
      var val = "bla";
      var op = ObjectOperation.Delete(path, val);

      var obj = { a: { c: "bla"} };
      assert.exception(errors.ChronicleError, function() {
        op.apply(obj);
      });
    },

    // Conflict cases
    "Transformation: create/create (conflict)", function() {
      var path = ["a"];
      var val1 = "bla";
      var val2 = "blupp";
      var expected1 = {a: "blupp"};
      var expected2 = {a: "bla"};

      var a = ObjectOperation.Create(path, val1);
      var b = ObjectOperation.Create(path, val2);

      assert.isTrue(ObjectOperation.hasConflict(a, b));

      testTransform(a, b, {}, expected1);
      testTransform(b, a, {}, expected2);
    },

    "Transformation: delete/delete (conflict)", function() {
      var path = ["a"];
      var val = "bla";
      var input = {"a": val};
      var expected = {};

      var a = ObjectOperation.Delete(path, val);
      var b = ObjectOperation.Delete(path, val);

      assert.isTrue(ObjectOperation.hasConflict(a, b));

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: delete/create (conflict)", function() {
      var path = ["a"];
      var a = ObjectOperation.Delete(path, "bla");
      var b = ObjectOperation.Create(path, "blupp");
      var expected1 = {a: "blupp"};
      var expected2 = {};
      var obj, t;

      assert.isTrue(ObjectOperation.hasConflict(a, b));

      // Note: this is a ill-posed case, as create will fail when the value already exists.

      t = ObjectOperation.transform(a, b);
      obj = t[1].apply(a.apply({a: "bla"}));
      assert.isObjectEqual(expected1, obj);
      obj = t[0].apply(b.apply({}))
      assert.isObjectEqual(expected1, obj);

      t = ObjectOperation.transform(b, a);
      obj = t[1].apply(b.apply({}));
      assert.isObjectEqual(expected2, obj);
      obj = t[0].apply(a.apply({a: "bla"}))
      assert.isObjectEqual(expected2, obj);

    },

    "Transformation: delete/update (conflict)", function() {
      var path = ["a"];
      var a = ObjectOperation.Delete(path, "bla");
      var b = ObjectOperation.Update(path, "bla", "blupp");

      var input = {a : "bla"};
      var expected1 = {a: "blupp"};
      var expected2 = {};

      assert.isTrue(ObjectOperation.hasConflict(a, b));

      testTransform(a, b, input, expected1);
      testTransform(b, a, input, expected2);
    },

    "Transformation: create/update (conflict)", function() {
      var path = ["a"];
      var a = ObjectOperation.Create(path, "bla");
      var b = ObjectOperation.Update(path, "foo", "bar");
      var expected1 = {a: "bar"};
      var expected2 = {a: "bla"};
      var obj, t;

      assert.isTrue(ObjectOperation.hasConflict(a, b));

      // Note: this is a ill-posed case, as create will fail when the value already exists.

      t = ObjectOperation.transform(a, b);
      obj = t[1].apply(a.apply({}));
      assert.isObjectEqual(expected1, obj);
      obj = t[0].apply(b.apply({a: "foo"}))
      assert.isObjectEqual(expected1, obj);

      t = ObjectOperation.transform(b, a);
      obj = t[1].apply(b.apply({a: "foo"}));
      assert.isObjectEqual(expected2, obj);
      obj = t[0].apply(a.apply({}))
      assert.isObjectEqual(expected2, obj);
    },

    "Transformation: update/update (conflict)", function() {
      var path = ["a"];
      var a = ObjectOperation.Update(path, "bla", "blapp");
      var b = ObjectOperation.Update(path, "bla", "blupp");

      var input = {a : "bla"};
      var expected1 = {a: "blupp"};
      var expected2 = {a: "blapp"};

      assert.isTrue(ObjectOperation.hasConflict(a, b));

      testTransform(a, b, input, expected1);
      testTransform(b, a, input, expected2);
    },
  ];

};

ObjectOperationTest.__prototype__ = function() {

  var ID_IDX = 1;

  this.uuid = function() {
    return ""+ID_IDX++;
  };

  this.setup = function() {
    Chronicle.HYSTERICAL = true;
    this.index = Chronicle.Index.create();
    this.chronicle = Chronicle.create(this.index);

    ID_IDX = 1;
    Chronicle.uuid = this.uuid;

    this.obj = {};
    this.fixture();
  };

  this.fixture = function() {
  };

};
ObjectOperationTest.prototype = new ObjectOperationTest.__prototype__();


root.Substance.registerTest(['Chronicle', 'Object Operation'], new ObjectOperationTest());

})(this);
