(function(root) {

var test = {};

test.id = 'replicator-009-update-blob';
test.name = 'Replicate an Updated Blob';
test.category = 'Replicator';

var SEED = "lorem_ipsum.json";
var local, remote;

var INSERT_IMAGE = [
      "insert",
      {
        "id": "image1",
        "type": "image",
        "target": "back",
        "data": {
          "medium": "blob1",
          "large": "blob1",
          "caption": "A new image"
        }
      }
     ];

var UPDATED_IMAGE = [
      "update",
      {
        "id": "image1",
        "data": {
          "medium": "blob2",
          "large": "blob2",
          "caption": "Updated image"
        }
      }
     ];

test.actions = [
  "Initialization", function(cb) {
    local =  new Substance.MemoryStore();
    remote = new Substance.MemoryStore();
    session.localStore = local;
    session.remoteStore = new Substance.AsyncStore(remote);
    Substance.seeds.loadStoreSeed(SEED, function(err, seed) {
      if(err) return cb(err);
      local.seed(seed['oliver']);
      remote.seed(seed['oliver']);
      cb(null);
    });
  },

  "Initial replication", function(cb) {
    session.replicate(cb);
  },

  "Load document", function() {
    session.loadDocument("lorem_ipsum");
  },

  "Add a blob with commit locally", function() {
    session.localStore.createBlob("lorem_ipsum", "blob1", "BASE64_BLOBDATA");
    session.document.apply(INSERT_IMAGE);
  },

  "Replicate", function(cb) {
    session.replicate(cb);
  },

  "Update the image", function() {
    session.localStore.createBlob("lorem_ipsum", "blob2", "BASE64_BLOBDATA");
    session.document.apply(UPDATED_IMAGE);
  },

  "Replicate", function(cb) {
    session.replicate(cb);
  },
];

root.Substance.registerTest(test);
})(this);
