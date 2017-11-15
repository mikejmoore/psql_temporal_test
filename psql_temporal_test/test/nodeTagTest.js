let knex = require('knex')(require('../knexfile.js').development)
let assert = require('assert')
let should = require('should')
let NodeWriter = require('../data/nodeWriter.js')
let TagWriter = require('../data/tagWriter.js')
let NodeTree = require('../data/nodeTree.js')
const Const = require('../data/constants')
const triggerUtils = require('../database_support/triggerUtils')
nodeWriter = new NodeWriter(knex)
const tagWriter = new TagWriter(knex)

describe('NodeTags', async () => {

  it('Should allow knowing the tags on a node at specific times', async () => {
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
    // Tag the top node with "Important" on 2017-01-01 and change to "Critical" on 2017-06-01
    var nodeTag = await nodeWriter.addTagToNode(latestTopNode, tagCritical, '2017-06-01')
    await nodeWriter.addTagToNodePreceding(nodeTag, latestTopNode, tagImportant, '2017-01-01')

    var nodeTag = await nodeWriter.addTagToNode(latestTopNode, tagFeature, '2017-06-01')
    await nodeWriter.addTagToNodePreceding(nodeTag, latestTopNode, tagBug, '2017-01-01')

    await triggerUtils.applyTriggers(knex)

    console.info("Check for latest tags (Critical, Feature) for recent date")
    var tree = new NodeTree(knex, latestTopNode.id, '2017-08-01')
    var node = await tree.jsonTree()
    node.tags.should.containEql('Critical');
    node.tags.should.containEql('Feature');

    console.info("Check for tags (Important, Bug) for date further back")
    tree = new NodeTree(knex, latestTopNode.id, '2017-02-01')
    node = await tree.jsonTree()
    node.tags.should.containEql('Important');
    node.tags.should.containEql('Bug');
  })



})
