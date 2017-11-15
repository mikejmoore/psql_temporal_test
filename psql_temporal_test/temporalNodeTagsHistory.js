let knex = require('knex')(require('./knexfile.js').development)
let NodeWriter = require('./data/nodeWriter.js')
let TagWriter = require('./data/tagWriter.js')
let NodeTree = require('./data/nodeTree.js')
const Const = require('./data/constants')
var should  = require('should');
var assert  = require('assert');
const triggerUtils = require('./database_support/triggerUtils')
nodeWriter = new NodeWriter(knex)
const tagWriter = new TagWriter(knex)

async function main() {
  await triggerUtils.removeTriggers(knex)

  let tagCritical = await tagWriter.findOrCreateTag({category: 'Importance', name: 'Critical', started_at: '2000-01-01'})
  let tagImportant = await tagWriter.findOrCreateTag({category: 'Importance', name: 'Important', started_at: '2000-01-01'})
  let tagAverage = await tagWriter.findOrCreateTag({category: 'Importance', name: 'Average Importance', started_at: '2000-01-01'})
  let tagTrivial = await tagWriter.findOrCreateTag({category: 'Importance', name: 'Trivial', started_at: '2000-01-01'})

  let tagFeature = await tagWriter.findOrCreateTag({category: 'type', name: 'Feature', started_at: '2000-01-01'})
  let tagBug = await tagWriter.findOrCreateTag({category: 'type', name: 'Bug', started_at: '2000-01-01'})

  console.info("Creating top node (current time)")
  let latestTopNode = await nodeWriter.insertNode(
      { name: 'My Great Document',
        node_type: 'document',
        started_at: '2017-01-01'
      })
  var nodeTag = await nodeWriter.addTagToNode(latestTopNode, tagCritical, '2017-06-01')
  await nodeWriter.addTagToNodePreceding(nodeTag, latestTopNode, tagImportant, '2017-01-01')

  var nodeTag = await nodeWriter.addTagToNode(latestTopNode, tagFeature, '2017-06-01')
  await nodeWriter.addTagToNodePreceding(nodeTag, latestTopNode, tagBug, '2017-01-01')


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
  nodeTag = await nodeWriter.addTagToNode(latestChild1Node, tagImportant, '2017-06-01')
  await nodeWriter.addTagToNodePreceding(nodeTag, latestChild1Node, tagTrivial, '2017-01-01')

  let latestChild2Node = await nodeWriter.insertNode(
      { name: 'Section 2 - Improved',
        parent_id: latestTopNode.id,
        node_type: 'section',
        started_at: '2017-02-01'
      })
  nodeTag = await nodeWriter.addTagToNode(latestChild2Node, tagAverage, '2017-06-01')
  await nodeWriter.addTagToNodePreceding(nodeTag, latestChild2Node, tagTrivial, '2017-01-01')

  let latestDeepChildNode = await nodeWriter.insertNode(
      { name: 'Entry',
        parent_id: latestChild1Node.id,
        node_type: 'entry',
        started_at: '2017-07-01'})

  var nodeTag = await nodeWriter.addTagToNode(latestDeepChildNode, tagFeature, '2017-06-01')
  await nodeWriter.addTagToNodePreceding(nodeTag, latestDeepChildNode, tagBug, '2017-01-01')

  await triggerUtils.applyTriggers(knex)

  var tree = new NodeTree(knex, latestTopNode.id, '2017-08-01')
  await tree.display()

  var tree = new NodeTree(knex, latestTopNode.id, '2017-05-01')
  await tree.display()

  process.exit()
}

main()
