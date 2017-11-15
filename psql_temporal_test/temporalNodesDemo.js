//import * as Const from './data/constants';
let knex = require('knex')(require('./knexfile.js').development)
let bookshelf = require('bookshelf')(knex)
let NodeWriter = require('./data/nodeWriter.js')
let NodeTree = require('./data/nodeTree.js')
let NodeDate = require('./data/nodeDate.js')
const uuidv4 = require('uuid/v4');
const Const = require('./data/constants')

nodeWriter = new NodeWriter(knex)

var Node = bookshelf.Model.extend({
  tableName: 'nodes',
  children: function() {
    return this.hasMany(Node);
  }
});

var Tag = bookshelf.Model.extend({
  tableName: 'tags'
})

async function writeTag(name, createdAt) {
  var now = new Date()
  console.info(`Writing tag: ${name}`)
  await knex('tags').insert({
//        id: uuidv4(),
        created_at: createdAt,
        name: name
      }, 'id')
}

function indentString(level) {
  return("  ".repeat(level))
}


nodeWriter.createNode().then((nodeId) => {
  console.info(`Created node: ${nodeId}`)
  var nodeTree = new NodeTree(knex, nodeId)
  return nodeTree.jsonTree(nodeId)
  .then(nodeJson => {
    return nodeTree
  })
}).then((nodeTree) => {
  var prettyJson = JSON.stringify(nodeTree.topLevelNode, null, 2);
  console.info(prettyJson)
  let node = nodeTree.findNodeWithName('Section 1.1')
  node['period'] = '[2010-01-01, 2015-01-01)'
  node['created_at'] = '2010-01-01'
  node['name'] = 'Old Name'
  return nodeWriter.insertFakeNodeHistory(node)
}).then((node) => {
  var nodeDate = new NodeDate(knex)
  return nodeDate.findNodeOnDate(node.id, '2011-01-01')
}).then((historicalNode) => {
  console.info(`The name of the node was: ${historicalNode.name}`)
})



//  This works in PSQL
//  update nodes_history set period='[2017-9-11,2017-11-11 22:39:20)' where name='Document 1';
