(function(root) {

var util = root.Substance.util;
var Chronicle = root.Substance.Chronicle;
var ChronicleTest = root.Substance.test.ChronicleTest;
var ROOT = Chronicle.Index.ROOT_ID;

// Index structure:
//
// ROOT - 01 - 02 - 03 - 04
//    |              |
//    |                - 05 - 06
//      - 07 - 08

var Merge = function() {

  ChronicleTest.call(this);

  this.actions = [

    "Merge 01 into 02 (nothing to be done)", function() {
      this.chronicle.open("02");
      var count = this.index.list().length;
      this.chronicle.merge("01");
      // no additional change should have been applied
      assert.isEqual(count, this.index.list().length);
    },

    "Merge 02 into 01 (fast-forward, no extra change)", function() {
      this.chronicle.open("01");
      var count = this.index.list().length;
      this.chronicle.merge("02");
      // no additional change should have been applied
      assert.isEqual(count, this.index.list().length);
      assert.isEqual("02", this.comp.getState());
    },

    "Merge 08 into 02 by rejecting theirs", function() {
      this.chronicle.open("02");
      this.M1 = this.chronicle.merge("08", "mine");
      // a new change should have been created
      assert.isTrue(this.index.contains(this.M1));
      assert.isEqual(this.M1, this.comp.getState());

      this.chronicle.open(ROOT);
      this.chronicle.open(this.M1);

      // the value should be the same as that of 02
      assert.isEqual(this.M1, this.comp.getState());
      assert.isEqual(this.RESULTS["02"], this.comp.result);
    },

    "Merge 08 into 02 by rejecting mine", function() {
      this.chronicle.open("02");
      this.M2 = this.chronicle.merge("08", "theirs");
      // a new change should have been created
      assert.isTrue(this.index.contains(this.M2));
      assert.isEqual(this.M2, this.comp.getState());

      this.chronicle.open(ROOT);
      this.chronicle.open(this.M2);

      // the value should be the same as that of 02
      assert.isEqual(this.M2, this.comp.getState());
      assert.isEqual(this.RESULTS["08"], this.comp.result);
    },

    "Traversal across merge (reverting the merge)", function() {
      this.chronicle.open(this.M1);
      var path = [this.M1, "08"];
      for (var idx=0; idx < 2; idx++) {
        path.unshift(this.next_uuid());
        this.op(idx);;
      }
      this.chronicle.step(path);
      assert.isEqual("08", this.comp.getState());
      assert.isEqual(this.RESULTS["08"], this.comp.result);
    },

    "Manual merging", function() {
      this.chronicle.open("04");
      // to compare the result apply "06" manually
      this.op(5);
      var expected = this.comp.result;

      this.chronicle.open("04");
      this.M3 = this.chronicle.merge("06", "manual", {sequence: ["04", "06"]});
      assert.isTrue(this.index.contains(this.M3));
      assert.isEqual(this.M3, this.comp.getState());

      assert.isEqual(expected, this.comp.result);
    },

    "Traversal across manual merge", function() {
      this.chronicle.open(this.M3);
      this.chronicle.step(["06", "05"]);
      assert.isEqual("05", this.comp.getState());
      assert.isEqual(this.RESULTS["05"], this.comp.result);
    },
  ];
};
Merge.prototype = ChronicleTest.prototype;

root.Substance.registerTest(['Chronicle', 'Merge'], new Merge());

})(this);
