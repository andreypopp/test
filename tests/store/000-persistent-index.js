(function(root) {

var assert = root.Substance.assert;
//var _ = root._;

var Chronicle = root.Substance.Chronicle;
var Change = Chronicle.Change;
var PersistentIndex = Chronicle.PersistentIndex;

function PersistentIndexTest(impl) {

  this.setup = function() {
    impl.setup();
    this.store = impl.store;
    this.index = new PersistentIndex(this.store);

    this.changes = this.index.__changes__;
    this.refs = this.index.__refs__;
  };

  this.actions = [

    "Add should store change", function() {
      this.index.add(new Change(1, "ROOT", {val: 1}));
      this.index.add(new Change(2, 1, {val: 2}));
      this.index.add(new Change(3, 2, {val: 3}));
      this.index.add(new Change(4, 1, {val: 4}));

      var keys = this.changes.keys().slice(0);
      assert.isArrayEqual([1, 2, 3, 4], keys.sort());

      for (var idx = 1; idx <= 4; idx++) {
        var c = this.changes.get(idx);
        assert.isObjectEqual({val: idx}, c.data);
      }
    },

    "Persistent refs", function() {
      this.index.setRef("/remote/origin/master", 1);
      this.index.setRef("master:HEAD", 2);
      this.index.setRef("master:LAST", 3);
      this.index.setRef("other", 4);

      assert.isEqual(1, this.refs.get("/remote/origin/master"));
      assert.isEqual(2, this.refs.get("master:HEAD"));
      assert.isEqual(3, this.refs.get("master:LAST"));
      assert.isEqual(4, this.refs.get("other"));
    },

    "Remove change", function() {
      this.index.add(new Change(5, 1, {val: 5}));
      assert.isDefined(this.changes.get(5));
      this.index.remove(5);
      assert.isUndefined(this.changes.get(5));
    },

    "Import from store", function() {
      var index2 = new PersistentIndex(this.store);

      assert.isArrayEqual(["1","2","3","4","ROOT"], index2.list().sort())
      assert.isArrayEqual(["/remote/origin/master", "master:HEAD", "master:LAST", "other"], index2.listRefs().sort())
    },

  ];

}

if (!root.Substance.test) root.Substance.test = {};
root.Substance.test.PersistentIndexTest = PersistentIndexTest;

})(this);
