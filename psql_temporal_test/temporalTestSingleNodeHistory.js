let knex = require('knex')(require('./knexfile.js').development)
let NodeWriter = require('./data/nodeWriter.js')
let NodeTree = require('./data/nodeTree.js')
const Const = require('./data/constants')
const triggerUtils = require('./database_support/triggerUtils')
nodeWriter = new NodeWriter(knex)

async function main() {
  await triggerUtils.removeTriggers(knex)
  let latestTopNode = await nodeWriter.insertNode(
      { name: 'My Great Document',
        node_type: 'document',
        started_at: '2017-01-01'
      })
  let olderTopNode = await nodeWriter.insertNodePreceding(latestTopNode,
      {
        name: 'Old Document',
        node_type: 'document',
        started_at: '2016-01-01'
      })
  await triggerUtils.applyTriggers(knex)

  var snapshotDate = '2017-06-01'
  var tree = new NodeTree(knex, latestTopNode.id, '2017-06-01')
  await tree.display()

  var tree = new NodeTree(knex, latestTopNode.id, '2016-06-01')
  await tree.display()

  process.exit()
}

main()
