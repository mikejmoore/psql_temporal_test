let knex = require('knex')(require('./knexfile.js').development)
let NodeWriter = require('./data/nodeWriter.js')
let TagWriter = require('./data/tagWriter.js')
let NodeTree = require('./data/nodeTree.js')
const Const = require('./data/constants')
const triggerUtils = require('./database_support/triggerUtils')

const nodeWriter = new NodeWriter(knex)

async function main() {
  triggerUtils.removeTriggers(knex)
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

  let latestChild1Node = await nodeWriter.insertNode(
      { name: 'Section 1 - Improved',
        parent_id: latestTopNode.id,
        node_type: 'section',
        started_at: '2017-02-01'
      })

  let latestChild2Node = await nodeWriter.insertNode(
      { name: 'Section 2 - Improved',
        parent_id: latestTopNode.id,
        node_type: 'section',
        started_at: '2017-02-01'
      })

  let latestDeepChildNode = await nodeWriter.insertNode(
      { name: 'Entry',
        parent_id: latestChild1Node.id,
        node_type: 'entry',
        started_at: '2017-07-01'
      })

  // Deep child is switching parents
  await nodeWriter.insertNodePreceding(latestDeepChildNode,
      {
        parent_id: latestChild2Node.id,
        name: 'Entry',
        node_type: 'document',
        started_at: '2017-02-01'
      })

  triggerUtils.applyTriggers(knex)

  var tree = new NodeTree(knex, latestTopNode.id, '2017-07-02')
  await tree.display()

  var tree = new NodeTree(knex, latestTopNode.id, '2017-06-01')
  await tree.display()

  var tree = new NodeTree(knex, latestTopNode.id, '2016-06-01')
  await tree.display()

  process.exit()
}

main()
