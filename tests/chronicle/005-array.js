(function(root) {

var assert = root.Substance.assert;
var Chronicle = root.Substance.Chronicle;
var ArrayOperation = Chronicle.OT.ArrayOperation;

// Index:
//
// ROOT - 1  -  2  -  3  -  4  -  5
//        |                 \
//        |                   M1 (1,2,6,4)
//        |---  6  ---------/

var OP_1 = new ArrayOperation([ArrayOperation.INS, 0, 1]);
var OP_2 = new ArrayOperation([ArrayOperation.INS, 1, 3]);
var OP_3 = new ArrayOperation([ArrayOperation.INS, 1, 2]);
var OP_4 = new ArrayOperation([ArrayOperation.MOV, 0, 2]);
var OP_5 = new ArrayOperation([ArrayOperation.DEL, 1, 3]);
var OP_6 = new ArrayOperation([ArrayOperation.INS, 1, 4]);

var ARR_1 = [1];
var ARR_2 = [1,3];
var ARR_3 = [1,2,3];
var ARR_4 = [2,3,1];
var ARR_5 = [2,1];
//var ARR_6 = [1,4];

// Note: if you merge a move it will have its range between elements
// that existed in that branch. It can't reach behind or before elements that have been
// inserted at front or back in another branch.
// The consequence is that merge in the example above results in [3,1,4] and not [3,4,1].
var ARR_M1 = [3,1,4];

function testTransform(a, b, input, expected) {
  var t = ArrayOperation.transform(a, b);

  var output = t[1].apply(a.apply(input.slice(0)));
  assert.isArrayEqual(expected, output);

  output = t[0].apply(b.apply(input.slice(0)));
  assert.isArrayEqual(expected, output);

}


var ArrayOperationTest = function() {

  this.actions = [

    // All cases are tested canonically. No convenience. Completeness.

    // Insert-Insert Transformations
    // --------
    // Cases:
    //  1. `a < b`:   operations should not be affected
    //  2. `b < a`:   dito
    //  3. `a == b`:  result depends on preference (first applied)

    "Transformation: a=Insert, b=Insert (1,2), a < b and b < a", function() {
      var input = [1,3,5];
      var expected = [1,2,3,4,5];
      var a = new ArrayOperation(["+", 1, 2]);
      var b = new ArrayOperation(["+", 2, 4]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    // Example:
    //     A = [1,4], a = [+, 1, 2], b = [+, 1, 3]
    //     A  - a ->  [1, 2, 4]   - b' ->   [1,2,3,4]     => b'= [+, 2, 3], transform(a, b) = [a, b']
    //     A  - b ->  [1, 3, 4]   - a' ->   [1,3,2,4]     => a'= [+, 2, 2], transform(b, a) = [a', b]
    "Transformation: a=Insert, b=Insert (3), a == b", function() {
      var input = [1,4];
      var expected = [1,2,3,4];
      var expected_2 = [1,3,2,4];
      var a = new ArrayOperation(["+", 1, 2]);
      var b = new ArrayOperation(["+", 1, 3]);

      // in this case the transform is not symmetric
      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected_2);
    },

    // Delete-Delete Transformations
    // --------
    // Cases:
    //  1. `a < b`:   operations should not be affected
    //  2. `b < a`:   dito
    //  3. `a == b`:  second operation should not have an effect;
    //                user should be noticed about conflict

    "Transformation: a=Delete, b=Delete (1,2), a < b and b < a", function() {
      var input = [1,2,3,4,5];
      var expected = [1,3,5];
      var a = new ArrayOperation(["-", 1, 2]);
      var b = new ArrayOperation(["-", 3, 4]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Delete, b=Delete (3), a == b", function() {
      var input = [1,2,3];
      var expected = [1,3];
      var a = new ArrayOperation(["-", 1, 2]);
      var b = new ArrayOperation(["-", 1, 2]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    // Insert-Delete Transformations
    // --------
    // Cases: (a = insertion, b = deletion)
    //  1. `a < b`:   b must be shifted right
    //  2. `b < a`:   a must be shifted left
    //  3. `a == b`:  ???

    //     A = [1,3,4,5], a = [+, 1, 2], b = [-, 2, 4]
    //     A  - a ->  [1,2,3,4,5] - b' ->   [1,2,3,5]     => b'= [-, 3, 4]
    //     A  - b ->  [1,3,5]     - a' ->   [1,2,3,5]     => a'= [+, 1, 2] = a
    "Transformation: a=Insert, b=Delete (1), a < b", function() {
      var input = [1,3,4,5];
      var expected = [1,2,3,5];
      var a = new ArrayOperation(["+", 1, 2]);
      var b = new ArrayOperation(["-", 2, 4]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [1,2,3,5], a = [+,3,4], b = [-,1,2]
    //     A  - a ->  [1,2,3,4,5] - b' ->   [1,3,4,5]     => b'= [-,1,2] = b
    //     A  - b ->  [1,3,5]     - a' ->   [1,3,4,5]     => a'= [+,2,4]
   "Transformation: a=Insert, b=Delete (2), b < a", function() {
      var input = [1,2,3,5];
      var expected = [1,3,4,5];
      var a = new ArrayOperation(["+", 3, 4]);
      var b = new ArrayOperation(["-", 1, 2]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [1,2,3], a = [+,1,4], b = [-,1,2]
    //     A  - a ->  [1,4,2,3] - b' ->   [1,4,3]     => b'= [-,2,2]
    //     A  - b ->  [1,3]     - a' ->   [1,4,3]     => a'= [+,1,4] = a
    "Transformation: a=Insert, b=Delete (3), a == b", function() {
      var input = [1,2,3];
      var expected = [1,4,3];
      var a = new ArrayOperation(["+", 1, 4]);
      var b = new ArrayOperation(["-", 1, 2]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    // Move-Delete Transformations
    // --------
    // Cases: (a = move, b = deletion)
    //  Total number of cases:
    //    `(strict order) + (one equality) + (two equalities) = 3! + (2 from 3)*2 + 1 = 6 + 6 + 1 = 13`
    //  1. `a.s < a.t < b`
    //  2. `a.s < b < a.t`
    //  3. `a.t < a.s < b`
    //  4. `a.t < b < a.s`
    //  5. `b < a.s < a.t`
    //  6. `b < a.t < a.s`
    //  7. `a.s ==  a.t <  b`
    //  8. `b   <   a.s == a.t`
    //  9. `a.s ==  b   <  a.t`
    //  10.`a.t <   a.s == b`
    //  11.`a.t ==  b   <  a.s`
    //  12.`a.s <   a.t == b`
    //  13.`a.s == a.t == b`

    "Transformation: a=Move, b=Delete (1), a.s < a.t < b", function() {
      var input = [1,2,3];
      var expected = [2,1];
      var a = new ArrayOperation([">>", 0, 1]);
      var b = new ArrayOperation(["-", 2, 3]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Delete (2), a.s < b < a.t", function() {
      var input = [1,2,3];
      var expected = [3,1];
      var a = new ArrayOperation([">>", 0, 2]);
      var b = new ArrayOperation(["-", 1, 2]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Delete (3), a.t < a.s < b", function() {
      var input = [1,2,3];
      var expected = [2,1];
      var a = new ArrayOperation([">>", 1, 0]);
      var b = new ArrayOperation(["-", 2, 3]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Delete (4), a.t < b < a.s", function() {
      var input = [1,2,3];
      var expected = [3,1];
      var a = new ArrayOperation([">>", 2, 0]);
      var b = new ArrayOperation(["-", 1, 2]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Delete (5), b < a.s < a.t", function() {
      var input = [1,2,3];
      var expected = [3,2];
      var a = new ArrayOperation([">>", 1, 2]);
      var b = new ArrayOperation(["-", 0, 1]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Delete (6), b < a.t < a.s", function() {
      var input = [1,2,3];
      var expected = [3,2];
      var a = new ArrayOperation([">>", 2, 1]);
      var b = new ArrayOperation(["-", 0, 1]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Delete (7), a.s == a.t < b", function() {
      var input = [1,2,3];
      var expected = [1,3];
      var a = new ArrayOperation([">>", 0, 0]);
      var b = new ArrayOperation(["-", 1, 2]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Delete (8), b < a.s == a.t", function() {
      var input = [1,2,3];
      var expected = [2,3];
      var a = new ArrayOperation([">>", 2, 2]);
      var b = new ArrayOperation(["-", 0, 1]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Delete (9), a.s == b < a.t", function() {
      var input = [1,2,3];
      var expected = [2,3];
      var a = new ArrayOperation([">>", 0, 2]);
      var b = new ArrayOperation(["-", 0, 1]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Delete (10), a.t < a.s == b", function() {
      var input = [1,2,3];
      var expected = [1,2];
      var a = new ArrayOperation([">>", 2, 0]);
      var b = new ArrayOperation(["-", 2, 3]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [1,2,3], a = [>>,2,0], b = [-,0,1]
    //     A  - a ->  [3,1,2] - b' ->   []   => b'= [-,1,1]
    //     A  - b ->  [2,3]   - a' ->   []   => a'= [>>,1,0]
    "Transformation: a=Move, b=Delete (11), a.t == b < a.s", function() {
      var input = [1,2,3];
      var expected = [3,2];
      var a = new ArrayOperation([">>", 2, 0]);
      var b = new ArrayOperation(["-", 0, 1]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Delete (12), a.s < a.t == b", function() {
      var input = [1,2,3];
      var expected = [2,1];
      var a = new ArrayOperation([">>", 0, 2]);
      var b = new ArrayOperation(["-", 2, 3]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Delete (13), a.s == a.t == b", function() {
      var input = [1,2,3];
      var expected = [2,3];
      var a = new ArrayOperation([">>", 0, 0]);
      var b = new ArrayOperation(["-", 0, 1]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    // Move-Insert Transformations
    // --------
    // Cases: (a = move, b = insertion)
    //  Total number of cases:
    //    `(strict order) + (one equality) + (two equalities) = 3! + (2 from 3)*2 + 1 = 6 + 6 + 1 = 13`
    //  1. `a.s < a.t < b`
    //  2. `a.s < b < a.t`
    //  3. `a.t < a.s < b`
    //  4. `a.t < b < a.s`
    //  5. `b < a.s < a.t`
    //  6. `b < a.t < a.s`
    //  7. `a.s ==  a.t <  b`
    //  8. `b   <   a.s == a.t`
    //  9. `a.s ==  b   <  a.t`
    //  10.`a.t <   a.s == b`
    //  11.`a.t ==  b   <  a.s`
    //  12.`a.s <   a.t == b`
    //  13.`a.s == a.t == b`

    "Transformation: a=Move, b=Insert (1), a.s < a.t < b", function() {
      var input = [1,2];
      var expected = [2,1,3];
      var a = new ArrayOperation([">>", 0, 1]);
      var b = new ArrayOperation(["+", 2, 3]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Insert (2), a.s < b < a.t", function() {
      var input = [1,3,4];
      var expected = [2,3,4,1];
      var a = new ArrayOperation([">>", 0, 2]);
      var b = new ArrayOperation(["+", 1, 2]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Insert (3), a.t < a.s < b", function() {
      var input = [1,2];
      var expected = [2,1,3];
      var a = new ArrayOperation([">>", 1, 0]);
      var b = new ArrayOperation(["+", 2, 3]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Insert (4), a.t < b < a.s", function() {
      var input = [1,3,4];
      var expected = [4,1,2,3];
      var a = new ArrayOperation([">>", 2, 0]);
      var b = new ArrayOperation(["+", 1, 2]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Insert (5), b < a.s < a.t", function() {
      var input = [2,3,4];
      var expected = [1,2,4,3];
      var a = new ArrayOperation([">>", 1, 2]);
      var b = new ArrayOperation(["+", 0, 1]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Insert (6), b < a.t < a.s", function() {
      var input = [2,3,4];
      var expected = [1,2,4,3];
      var a = new ArrayOperation([">>", 2, 1]);
      var b = new ArrayOperation(["+", 0, 1]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Insert (7), a.s == a.t < b", function() {
      var input = [1,3];
      var expected = [1,2,3];
      var a = new ArrayOperation([">>", 0, 0]);
      var b = new ArrayOperation(["+", 1, 2]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Insert (8), b < a.s == a.t", function() {
      var input = [2,3];
      var expected = [1,2,3];
      var a = new ArrayOperation([">>", 1, 1]);
      var b = new ArrayOperation(["+", 0, 1]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [0,2,3,4], a = [>>,1,2], b = [+,1,1]
    //     A  - a ->  [0,3,2,4]   - b' ->   [0,1,3,2,4]     => b'= [+,1,1] = b
    //     A  - b ->  [0,1,2,3,4] - a' ->   [0,1,3,2,4]     => a'= [>>,2,3]
    //
    //      a: move '2' after '3' and before '4',   b: insert '1' after '0' and before '2'

    "Transformation: a=Move, b=Insert (9), a.s == b < a.t", function() {
      var input = [0,2,3,4];
      var expected = [0,1,3,2,4];
      var a = new ArrayOperation([">>", 1, 2]);
      var b = new ArrayOperation(["+", 1, 1]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [0,1,3,4], a = [>>,2,0], b = [+,2,2]
    //     A  - a ->  [3,0,1,4]   - b' ->   [3,0,1,2,4]     => b'= [+,3,2]
    //     A  - b ->  [0,1,2,3,4] - a' ->   [3,0,1,2,4]     => a'= [>>,3,0]
    //
    // To keep the original semantic
    //
    //    a: move '3' before '0',   b: insert '2' after 1 and before 3
    //
    // The only possible resolution is:
    //    [3,0,1,4]   -[ +,3,2]->  [3,0,1,2,4] (insert '2' after '1')
    //    [0,1,2,3,4] -[>>,3,0]->  [3,0,1,2,4] (move '3' before '0')
    "Transformation: a=Move, b=Insert (10), a.t < a.s == b", function() {
      var input = [0,1,3,4];
      var expected = [3,0,1,2,4];
      var a = new ArrayOperation([">>", 2, 0]);
      var b = new ArrayOperation(["+", 2, 2]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [0,2,3,4], a = [>>,3,1], b = [+,1,1]
    //     A  - a ->  [0,4,2,3]   - b' ->   [0,4,1,2,3]     => b'= [+,2,1]
    //     A  - b ->  [0,1,2,3,4] - a' ->   [0,4,1,2,3]     => a'= [>>,4,1]
    //
    //    a: move '4' after '0' and before '2',   b: insert '1' after 0 and before 2
    //
    //    [0,4,2,3]   -[ +,?,1]->  [0,1,4,2,3] [0,4,1,2,3]
    //    [0,1,2,3,4] -[>>,4,?]->  [0,1,4,2,3] [0,4,1,2,3]
    //
    //    [0,4,1,2,3]: a'=[>>,4,1], b'=[+,2,1]
    //    [0,1,4,2,3]: a'=[>>,4,2], b'=[+,1,1]=b
    //
    //  Similar to Insert/Insert, a==b, the result is generated by preference
    //
    //      t(a,b) -> [0,4,1,2,3] (insert '4' then '1')
    //      t(b,a) -> [0,1,4,2,3] (insert '1' then '4')
    "Transformation: a=Move, b=Insert (11), a.t == b < a.s", function() {
      var input = [0,2,3,4];
      var expected1 = [0,4,1,2,3];
      var expected2 = [0,1,4,2,3];
      var a = new ArrayOperation([">>", 3, 1]);
      var b = new ArrayOperation(["+", 1, 1]);

      testTransform(a, b, input, expected1);
      testTransform(b, a, input, expected2);
    },

    //     A = [0,1,2,4,5], a = [>>,1,3], b = [+,3,3]
    //     A  - a ->  [0,2,4,1,5]   - b' ->   [0,2,3,4,1,5]   => b'= [+,2,3]
    //     A  - b ->  [0,1,2,3,4,5] - a' ->   [0,2,3,4,1,5]   => a'= [>>,1,4]
    //
    //    a: move '1' after '4' and before '5',   b: insert '3' after 2 and before 4
    //
    "Transformation: a=Move, b=Insert (12), a.s < a.t == b", function() {
      var input = [0,1,2,4,5];
      var expected = [0,2,3,4,1,5];
      var a = new ArrayOperation([">>", 1, 3]);
      var b = new ArrayOperation(["+", 3, 3]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Insert (13), a.s == a.t == b", function() {
      var input = [1,2,3];
      var expected = [1,3];
      var a = new ArrayOperation([">>", 1, 1]);
      var b = new ArrayOperation(["-", 1, 2]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    // Move-Move Transformations
    // --------
    // Cases:
    //  Total number of cases:
    //    (strict order) + (1x'==') + (2x'==') + (3x'==')
    //    = 4! + (2 from 4)*6 + 4!/4  + 1 = 24 + 36 + 6 + 1 = 67`


    //#1.  a.s < a.t < b.s < b.t
    //#2.  a.s < a.t < b.t < b.s
    //#3.  a.s < b.s < a.t < b.t
    //#4.  a.s < b.s < b.t < a.t
    //#5.  a.s < b.t < a.t < b.s
    //#6.  a.s < b.t < b.s < a.t
    //#7.  a.t < a.s < b.s < b.t
    //#8.  a.t < a.s < b.t < b.s
    //#9.  a.t < b.s < a.t < b.t
    //#10. a.t < b.s < b.t < a.s
    //#11. a.t < b.t < a.s < b.s
    //#12. a.t < b.t < b.s < a.s
    //#13. b.s < a.s < a.t < b.t
    //#14. b.s < a.s < b.t < a.t
    //#15. b.s < a.t < a.s < b.t
    //#16. b.s < a.t < b.t < a.s
    //#17. b.s < b.t < a.s < a.t
    //#18. b.s < b.t < a.t < a.s
    //#19. b.t < a.s < a.t < b.s
    //#20. b.t < a.s < b.s < a.t
    //#21. b.t < a.t < a.s < b.s
    //#22. b.t < a.t < b.s < a.s
    //#23. b.t < b.s < a.s < a.t
    //#24. b.t < b.s < a.t < a.s

    "Transformation: a=Move, b=Move (1 + 17), a.s < a.t < b.s < b.t", function() {
      var input = [1,2,3,4];
      var expected = [2,1,4,3];
      var a = new ArrayOperation([">>", 0, 1]);
      var b = new ArrayOperation([">>", 2, 3]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Move (2 + 18), a.s < a.t < b.t < b.s", function() {
      var input = [1,2,3,4];
      var expected = [2,1,4,3];
      var a = new ArrayOperation([">>", 1, 0]);
      var b = new ArrayOperation([">>", 3, 2]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },


    //     A = [1,2,3,4,5], a = [>>,0,2], b = [>>,1,3]
    //     A  - a ->  [2,3,1,4,5]   - b' ->   [3,1,4,2,5]   => b'= [>>,0,3]
    //     A  - b ->  [1,3,4,2,5]   - a' ->   [3,1,4,2,5]   => a'= [>>,0,1]
    //
    //     a: move "1" after "3" and before "4", b: move 2 after "4" and before "5"
    "Transformation: a=Move, b=Move (3 + 14), a.s < b.s < a.t < b.t", function() {
      var input = [1,2,3,4,5];
      var expected = [3,1,4,2,5];
      var a = new ArrayOperation([">>", 0, 2]);
      var b = new ArrayOperation([">>", 1, 3]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [1,2,3,4,5], a = [>>,0,3], b = [>>,1,2]
    //     A  - a ->  [2,3,4,1,5]   - b' ->   [3,2,4,1,5]   => b'= [>>,0,1]
    //     A  - b ->  [1,3,2,4,5]   - a' ->   [3,2,4,1,5]   => a'= [>>,0,3]
    //
    //     a: move "1" after "4" and before "5", b: move "2" after "3" and before "4"
    "Transformation: a=Move, b=Move (4 + 13), a.s < b.s < b.t < a.t", function() {
      var input = [1,2,3,4,5];
      var expected = [3,2,4,1,5];
      var a = new ArrayOperation([">>", 0, 3]);
      var b = new ArrayOperation([">>", 1, 2]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },


    //     A = [1,2,3,4,5], a = [>>,0,2], b = [>>,3,1]
    //     A  - a ->  [2,3,1,4,5]   - b' ->   [4,2,3,1,5]   => b'= [>>,3,0]
    //     A  - b ->  [1,4,2,3,5]   - a' ->   [4,2,3,1,5]   => a'= [>>,0,3]
    //
    //     a: move "1" after "3" and before "4", b: move "4" after "1" and before "2"
    "Transformation: a=Move, b=Move (5 + 16), a.s < b.t < a.t < b.s", function() {
      var input = [1,2,3,4,5];
      var expected = [4,2,3,1,5];
      var a = new ArrayOperation([">>", 0, 2]);
      var b = new ArrayOperation([">>", 3, 1]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [1,2,3,4,5], a = [>>,0,3], b = [>>,2,1]
    //     A  - a ->  [2,3,4,1,5]   - b' ->   [3,2,4,1,5]   => b'= [>>,1,0]
    //     A  - b ->  [1,3,2,4,5]   - a' ->   [3,2,4,1,5]   => a'= [>>,0,3]
    //
    //     a: move "1" after "4" and before "5", b: move "3" after "1" and before "2"
    "Transformation: a=Move, b=Move (6 + 15), a.s < b.t < b.s < a.t", function() {
      var input = [1,2,3,4,5];
      var expected = [3,2,4,1,5];
      var a = new ArrayOperation([">>", 0, 3]);
      var b = new ArrayOperation([">>", 2, 1]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Move (7 + 23), a.t < a.s < b.s < b.t", function() {
      var input = [1,2,3,4,5];
      var expected = [2,1,4,3,5];
      var a = new ArrayOperation([">>", 1, 0]);
      var b = new ArrayOperation([">>", 2, 3]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Move, b=Move (8 + 24), a.t < a.s < b.t < b.s", function() {
      var input = [1,2,3,4,5];
      var expected = [2,1,4,3,5];
      var a = new ArrayOperation([">>", 1, 0]);
      var b = new ArrayOperation([">>", 3, 2]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [1,2,3,4,5], a = [>>,2,0], b = [>>,1,3]
    //     A  - a ->  [3,1,2,4,5]   - b' ->   [3,1,4,2,5]   => b'= [>>,2,3]
    //     A  - b ->  [1,3,4,2,5]   - a' ->   [3,1,4,2,5]   => a'= [>>,1,0]
    //
    //     a: move "3" before "1", b: move "2" after "4" and before "5"
    "Transformation: a=Move, b=Move (9 + 20), a.t < b.s < a.s < b.t", function() {
      var input = [1,2,3,4,5];
      var expected = [3,1,4,2,5];
      var a = new ArrayOperation([">>", 2, 0]);
      var b = new ArrayOperation([">>", 1, 3]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [1,2,3,4,5], a = [>>,3,0], b = [>>,1,2]
    //     A  - a ->  [4,1,2,3,5]   - b' ->   [4,1,3,2,5]   => b'= [>>,2,3]
    //     A  - b ->  [1,3,2,4,5]   - a' ->   [4,1,3,2,5]   => a'= [>>,3,0]
    //
    //     a: move "4" before "1", b: move "2" after "3" and before "4"
    "Transformation: a=Move, b=Move (10 + 19), a.t < b.s < b.t < a.s", function() {
      var input = [1,2,3,4,5];
      var expected = [4,1,3,2,5];
      var a = new ArrayOperation([">>", 3, 0]);
      var b = new ArrayOperation([">>", 1, 2]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [1,2,3,4,5], a = [>>,2,0], b = [>>,3,1]
    //     A  - a ->  [3,1,2,4,5]   - b' ->   [3,1,4,2,5]   => b'= [>>,3,2]
    //     A  - b ->  [1,4,2,3,5]   - a' ->   [3,1,4,2,5]   => a'= [>>,3,0]
    //
    //     a: move "3" before "1", b: move "4" after "1" and before "2"
    "Transformation: a=Move, b=Move (11 + 22), a.t < b.t < a.s < b.s", function() {
      var input = [1,2,3,4,5];
      var expected = [3,1,4,2,5];
      var a = new ArrayOperation([">>", 2, 0]);
      var b = new ArrayOperation([">>", 3, 1]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [1,2,3,4,5], a = [>>,2,0], b = [>>,3,1]
    //     A  - a ->  [4,1,2,3,5]   - b' ->   [4,1,3,2,5]   => b'= [>>,3,2]
    //     A  - b ->  [1,3,2,4,5]   - a' ->   [4,1,3,2,5]   => a'= [>>,3,0]
    //
    //     a: move "4" before "1", b: move "3" after "1" and before "2"
    "Transformation: a=Move, b=Move (12 + 21), a.t < b.t < b.s < a.s", function() {
      var input = [1,2,3,4,5];
      var expected = [4,1,3,2,5];
      var a = new ArrayOperation([">>", 3, 0]);
      var b = new ArrayOperation([">>", 2, 1]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //#25-30. a.s == a.t (a isNOP)
    // 31. a.s == b.s < a.t < b.t
    // 32. a.s == b.s < b.t < a.t
    // 33. a.t < a.s == b.s < b.t
    // 34. b.t < a.s == b.s < a.t
    // 35. a.t < b.t < a.s == b.s
    // 36. b.t < a.t < a.s == b.s
    //#37. a.s == b.t < a.t < b.s
    //#38. a.s == b.t < b.s < a.t
    //#39. a.t < a.s == b.t < b.s
    //#40. b.s < a.s == b.t < a.t
    //#41. a.t < b.s < a.s == b.t
    //#42. b.s < a.t < a.s == b.t
    //#43. a.t == b.s < a.s < b.t
    //#44. a.t == b.s < b.t < a.s
    //#45. a.s < a.t == b.s < b.t
    //#46. b.t < a.t == b.s < a.s
    //#47. a.s < b.t < a.t == b.s
    //#48. b.t < a.s < a.t == b.s

    //#49. a.t == b.t < a.s < b.s
    //#50. a.t == b.t < b.s < a.s
    //#51. a.s < a.t == b.t < b.s
    //#52. b.s < a.t == b.t < a.s
    //#53. a.s < b.s < a.t == b.t
    //#54. b.s < a.s < a.t == b.t

    //#55-60. b.s == b.t (b isNOP)

    "Transformation: a=Move, b=Move (23-30 + 55-60), a.s == a.t (a is NOP)", function() {
      var input = [1,2,3,4,5];
      var expected = [1,3,2,4,5];
      var a = new ArrayOperation([">>", 0, 0]);
      var b = new ArrayOperation([">>", 2, 1]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //  If the user forces the transform (check=false) then we apply the strategy 'mine-before-theirs',
    //  which in fact makes the second move effective.
    //
    //   t(a,b): [1,2,3,4,5] -> [2,3,4,1,5] -> [2,3,1,4,5]    => b' = [3,2]
    //   t(b,a): [1,2,3,4,5] -> [2,3,1,4,5] -> [2,3,4,1,5]    => a' = [2,3]
    "Transformation: a=Move, b=Move (31+32), a.s == b.s < a.t < b.t", function() {
      var input = [1,2,3,4,5];
      var expected1 = [2,3,1,4,5];
      var expected2 = [2,3,4,1,5];
      var a = new ArrayOperation([">>", 0, 3]);
      var b = new ArrayOperation([">>", 0, 2]);

      testTransform(a, b, input, expected1);
      testTransform(b, a, input, expected2);
    },

    //   t(a,b): [1,2,3,4,5] -> [1,2,4,3,5] -> [1,3,2,4,5]    => b' = [3,1]
    //   t(b,a): [1,2,3,4,5] -> [1,3,2,4,5] -> [1,2,4,3,5]    => a' = [1,3]
   "Transformation: a=Move, b=Move (33+34), b.t < a.s == b.s < a.t", function() {
      var input = [1,2,3,4,5];
      var expected1 = [1,3,2,4,5];
      var expected2 = [1,2,4,3,5];
      var a = new ArrayOperation([">>", 2, 3]);
      var b = new ArrayOperation([">>", 2, 1]);

      testTransform(a, b, input, expected1);
      testTransform(b, a, input, expected2);
    },

    //   t(a,b): [1,2,3,4,5] -> [4,1,2,3,5] -> [1,4,2,3,5]    => b' = [0,1]
    //   t(b,a): [1,2,3,4,5] -> [1,4,2,3,5] -> [4,1,2,3,5]    => a' = [1,0]
   "Transformation: a=Move, b=Move (35+36), a.t < b.t < a.s == b.s", function() {
      var input = [1,2,3,4,5];
      var expected1 = [1,4,2,3,5];
      var expected2 = [4,1,2,3,5];
      var a = new ArrayOperation([">>", 3, 0]);
      var b = new ArrayOperation([">>", 3, 1]);

      testTransform(a, b, input, expected1);
      testTransform(b, a, input, expected2);
    },


    //     A = [1,2,3,4,5], a = [>>,1,2], b = [>>,3,1]
    //     A  - a ->  [1,3,2,4,5]   - b' ->   [1,4,3,2,5]   => b'= [>>,3,1]
    //     A  - b ->  [1,4,2,3,5]   - a' ->   [1,4,3,2,5]   => a'= [>>,2,3]
    //
    //     a: move "2" after "3" and before "4", b: move "4" after "1" and before "2"
    //
    //      [1,3,2,4,5] -b'-> [1,4,3,2,5],[1,3,4,2,5]
    //      [1,4,2,3,5] -a'-> [1,4,3,2,5],[1,2,4,3,5]
    "Transformation: a=Move, b=Move (37 + 44), a.s == b.t < a.t < b.s", function() {
      var input = [1,2,3,4,5];
      var expected = [1,4,3,2,5];
      var a = new ArrayOperation([">>", 1, 2]);
      var b = new ArrayOperation([">>", 3, 1]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [1,2,3,4,5], a = [>>,1,3], b = [>>,2,1]
    //     A  - a ->  [1,3,4,2,5]   - b' ->   [1,3,4,2,5]   => b'= [>>,1,1] = NOP
    //     A  - b ->  [1,3,2,4,5]   - a' ->   [1,3,4,2,5]   => a'= [>>,2,3] = a
    //
    //     a: move "2" after "4" and before "5", b: move "3" after "1" and before "2"
    //
    //      [1,3,4,2,5] -b'-> [1,3,4,2,5],[1,4,3,2,5]
    //      [1,3,2,4,5] -a'-> [1,3,4,2,5]
    "Transformation: a=Move, b=Move (38 + 43), a.s == b.t < b.s < a.t", function() {
      var input = [1,2,3,4,5];
      var expected = [1,3,4,2,5];
      var a = new ArrayOperation([">>", 1, 3]);
      var b = new ArrayOperation([">>", 2, 1]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [1,2,3,4,5], a = [>>,2,0], b = [>>,4,2]
    //     A  - a ->  [3,1,2,4,5]   - b' ->   [3,1,2,5,4]   => b'= [>>,4,3]
    //     A  - b ->  [1,2,3,5,4]   - a' ->   [3,1,2,5,4]   => a'= [>>,2,0] = a
    //
    //     a: move "3" before "1", b: move "5" after "3" and before "4"
    //
    //      [3,1,2,4,5] -b'-> [3,5,1,2,4],[3,1,2,5,4]
    //      [1,2,3,5,4] -a'-> [3,1,2,5,4]
    "Transformation: a=Move, b=Move (39 + 46), a.t < a.s == b.t < b.s", function() {
      var input = [1,2,3,4,5];
      var expected = [3,1,2,5,4];
      var a = new ArrayOperation([">>", 2, 0]);
      var b = new ArrayOperation([">>", 4, 2]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [1,2,3,4,5], a = [>>,2,4], b = [>>,0,2]
    //     A  - a ->  [1,2,4,5,3]   - b' ->   [2,1,4,5,3]   => b'= [>>,0,1]
    //     A  - b ->  [2,3,1,4,5]   - a' ->   [2,1,4,5,3]   => a'= [>>,1,3]
    //
    //     a: move "3" after "5", b: move "1" after "3" and before "4"
    //
    //      [1,2,4,5,3] -b'-> [2,4,5,3,1],[2,1,4,5,3]
    //      [2,3,1,4,5] -a'-> [2,1,4,5,3]
    // 40. b.s < a.s == b.t < a.t
    "Transformation: a=Move, b=Move (40 + 45), b.s < a.s == b.t < a.t", function() {
      var input = [1,2,3,4,5];
      var expected = [2,1,4,5,3];
      var a = new ArrayOperation([">>", 2, 4]);
      var b = new ArrayOperation([">>", 0, 2]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [1,2,3,4,5], a = [>>,3,1], b = [>>,2,3]
    //     A  - a ->  [1,4,2,3,5]   - b' ->   [1,4,2,3,5]   => b'= [>>,3,3] = NOP
    //     A  - b ->  [1,2,4,3,5]   - a' ->   [1,4,2,3,5]   => a'= [>>,2,1]
    //
    //     a: move "4" after "1" before "2", b: move "3" after "4" and before "5"
    //
    //      [1,4,2,3,5] -b'-> [1,4,2,3,5],[1,4,3,2,5]
    //      [1,2,4,3,5] -a'-> [1,4,2,3,5]
    "Transformation: a=Move, b=Move (41 + 48), a.t < b.s < a.s == b.t", function() {
      var input = [1,2,3,4,5];
      var expected = [1,4,2,3,5];
      var a = new ArrayOperation([">>", 3, 1]);
      var b = new ArrayOperation([">>", 2, 3]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [1,2,3,4,5], a = [>>,3,2], b = [>>,1,3]
    //     A  - a ->  [1,2,4,3,5]   - b' ->   [1,4,3,2,5]   => b'= [>>,1,3]
    //     A  - b ->  [1,3,4,2,5]   - a' ->   [1,4,3,2,5]   => a'= [>>,2,1]
    //
    //     a: move "4" after "2" before "3", b: move "2" after "4" and before "5"
    //
    //      [1,2,4,3,5] - b'-> [1,4,2,3,5], [1,4,3,2,5]
    //      [1,3,4,2,5] - a'-> [1,3,2,4,5], [1,4,3,2,5]
    "Transformation: a=Move, b=Move (42 + 47), b.s < a.t < a.s == b.t", function() {
      var input = [1,2,3,4,5];
      var expected = [1,4,3,2,5];
      var a = new ArrayOperation([">>", 3, 2]);
      var b = new ArrayOperation([">>", 1, 3]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [1,2,3,4,5], a = [>>,2,1], b = [>>,3,1]
    //     A  - a ->  [1,3,2,4,5]   - b' ->   [1,3,4,2,5]   => b'= [>>,0,3]
    //     A  - b ->  [1,4,2,3,5]   - a' ->   [1,3,4,2,5]   => a'= [>>,3,1]
    //
    //     a: move "3" after "1" before "2", b: move "4" after "1" and before "2"
    //
    //      [1,3,2,4,5] -b'-> [1,4,3,2,5],[1,3,4,2,5]
    //      [1,4,2,3,5] -a'-> [1,3,4,2,5],[1,4,3,2,5]
    //
    // This is an insertion conflict which needs resolution by preference.
    //
    //    transform(a,b):  [1,2,3,4,5] -> [1,3,4,2,5]
    //    transform(b,a):  [1,2,3,4,5] -> [1,4,3,2,5]
    "Transformation: a=Move, b=Move (49 + 50), a.t == b.t < a.s < b.s", function() {
      var input = [1,2,3,4,5];
      var expected1 = [1,3,4,2,5];
      var expected2 = [1,4,3,2,5];
      var a = new ArrayOperation([">>", 2, 1]);
      var b = new ArrayOperation([">>", 3, 1]);

      testTransform(a, b, input, expected1);
      testTransform(b, a, input, expected2);
    },

    //     A = [1,2,3,4,5], a = [>>,1,2], b = [>>,3,2]
    //     A  - a ->  [1,3,2,4,5]   - b' ->   [1,4,3,2,5]   => b'= [>>,3,1]
    //     A  - b ->  [1,2,4,3,5]   - a' ->   [1,4,3,2,5]   => a'= [>>,1,3]
    //
    //     a: move "2" after "3" before "4", b: move "4" after "2" and before "3"
    //
    //      [1,3,2,4,5] -b'-> [1,3,2,4,5], [1,4,3,2,5]
    //      [1,2,4,3,5] -a'-> [1,4,3,2,5], [1,2,4,3,5]
    //
    "Transformation: a=Move, b=Move (51 + 52), a.s < a.t == b.t < b.s", function() {
      var input = [1,2,3,4,5];
      var expected = [1,4,3,2,5];
      var a = new ArrayOperation([">>", 1, 2]);
      var b = new ArrayOperation([">>", 3, 2]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },


    //     A = [1,2,3,4,5], a = [>>,0,3], b = [>>,1,3]
    //     A  - a ->  [2,3,4,1,5]   - b' ->   [3,4,1,2,5]   => b'= [>>,0,3]
    //     A  - b ->  [1,3,4,2,5]   - a' ->   [3,4,1,2,5]   => a'= [>>,0,2]
    //
    //     a: move "1" after "4" before "5", b: move "2" after "4" and before "5"
    //
    // This is an insertion conflict which needs resolution by preference.
    //
    //    transform(a,b):  [1,2,3,4,5] -> [3,4,1,2,5]
    //    transform(b,a):  [1,2,3,4,5] -> [3,4,2,1,5]
    //
    "Transformation: a=Move, b=Move (53 + 54), a.s < b.s < a.t == b.t", function() {
      var input = [1,2,3,4,5];
      var expected1 = [3,4,1,2,5];
      var expected2 = [3,4,2,1,5];
      var a = new ArrayOperation([">>", 0, 3]);
      var b = new ArrayOperation([">>", 1, 3]);

      testTransform(a, b, input, expected1);
      testTransform(b, a, input, expected2);
    },

    //#61+62. a.s == a.t != b.s == b.t (a isNOP && b.isNOP)
    //#63+64. a.s == b.s != a.t == b.t (a and b are the same)
    //#65. a.s == b.t < a.t == b.s
    //#66. a.s == b.t > a.t == b.s
    //#67. a.s == b.t == a.t == b.s (a isNOP && b.isNOP)

    "Transformation: a=Move, b=Move (61+62), a.s == a.t < b.s == b.t", function() {
      var input = [1,2,3,4,5];
      var expected = [1,2,3,4,5];
      var a = new ArrayOperation([">>", 0, 0]);
      var b = new ArrayOperation([">>", 3, 3]);
      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    // Note: operations are equal, and should only be applied once
    "Transformation: a=Move, b=Move (63 + 64 + 67), a.s == b.s < a.t == b.t", function() {
      var input = [1,2,3,4,5];
      var expected = [1,3,4,2,5];
      var a = new ArrayOperation([">>", 1, 3]);
      var b = new ArrayOperation([">>", 1, 3]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [1,2,3,4,5], a = [>>,1,3], b = [>>,3,1]
    //     A  - a ->  [1,3,4,2,5]   - b' ->   [1,4,3,2,5]   => b'= [>>,2,1]
    //     A  - b ->  [1,4,2,3,5]   - a' ->   [1,4,3,2,5]   => a'= [>>,2,3]
    //
    //     a: move "2" after "4" before "5", b: move "4" after "1" and before "2"
    //
    //      [1,3,4,2,5] -b'-> [1,4,3,2,5], [1,3,4,2,5]
    //      [1,4,2,3,5] -a'-> [1,4,2,3,5], [1,4,3,2,5]
    //

    "Transformation: a=Move, b=Move (65 + 66), a.s == b.t < a.t == b.s", function() {
      var input = [1,2,3,4,5];
      var expected = [1,4,3,2,5];
      var a = new ArrayOperation([">>", 1, 3]);
      var b = new ArrayOperation([">>", 3, 1]);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [1,2,3,4,5], a = [>>,,], b = [>>,,]
    //     A  - a ->  [1,2,3,4,5]   - b' ->   []   => b'= [>>,,]
    //     A  - b ->  [1,2,3,4,5]   - a' ->   []   => a'= [>>,,]
    //
    //     a: move "" after "" before "", b: move "" after "" and before ""
    //
    //      [] -b'->
    //      [] -a'->
    //

    "Load fixture", function() {
      this.fixture();
    },

    "Basic checkout", function() {
      this.chronicle.open(this.ID4);
      assert.isArrayEqual(ARR_4, this.array);

      this.chronicle.open(this.ID1);
      assert.isArrayEqual(ARR_1, this.array);

      this.chronicle.open(this.ID5);
      assert.isArrayEqual(ARR_5, this.array);

      this.chronicle.open(this.ID3);
      assert.isArrayEqual(ARR_3, this.array);

      this.chronicle.open(this.ID2);
      assert.isArrayEqual(ARR_2, this.array);
    },

    "Manual merge", function() {
      this.chronicle.open(this.ID4);
      this.ID_M1 = this.chronicle.merge(this.ID6, "manual", {sequence: [this.ID2, this.ID6, this.ID4]});

      this.chronicle.open("ROOT");
      this.chronicle.open(this.ID_M1);
      assert.isArrayEqual(ARR_M1, this.array);
    },

  ];

};

ArrayOperationTest.__prototype__ = function() {

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

    this.array = [];
    this.adapter = new Chronicle.ArrayOperationAdapter(this.chronicle, this.array);
  };

  this.apply = function(op) {
    this.adapter.apply(op);
    return this.chronicle.record(op);
  };

  this.fixture = function() {
    this.ID1 = this.apply(OP_1);
    this.ID2 = this.apply(OP_2);
    this.ID3 = this.apply(OP_3);
    this.ID4 = this.apply(OP_4);
    this.ID5 = this.apply(OP_5);
    this.chronicle.reset(this.ID1);
    this.ID6 = this.apply(OP_6);
    this.chronicle.reset("ROOT");
  };

};
ArrayOperationTest.prototype = new ArrayOperationTest.__prototype__();

root.Substance.registerTest(['Chronicle', 'Array Operation'], new ArrayOperationTest());

})(this);
