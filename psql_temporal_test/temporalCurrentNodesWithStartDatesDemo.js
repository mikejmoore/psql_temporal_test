let knex = require('knex')(require('./knexfile.js').development)
let bookshelf = require('bookshelf')(knex)
let NodeWriter = require('./data/nodeWriter.js')
let NodeTree = require('./data/nodeTree.js')
const Const = require('./data/constants')

nodeWriter = new NodeWriter(knex)

async function main() {
  let document = {
        name: `Document`,
        node_type: 'document',
        created_at: '2010-01-01',
        children:  [
           { name: `Section 1`,
             node_type: 'section',
             created_at: '2011-01-01',
             children: [
              { name: 'Section 1.1',
                node_type: 'entry',
                created_at: '2011-01-01',
                children: [
                  {name: 'Section 1.1.1', node_type: 'entry', created_at: '2011-01-01'},
                  {name: 'Section 1.1.2', node_type: 'entry', created_at: '2012-01-01'}
                 ]
                  }
                ]
              },
              {name: 'Section 1.2',
                 node_type: 'entry',
                 created_at: '2015-01-01',
                 children: [
                  {name: 'Section 1.2.1', node_type: 'section', created_at: '2015-01-01'}
                 ]
                },
               {name: 'Section 1.3', node_type: 'section', created_at: '2011-01-01'}
            ]
       }
      let nodeId = await nodeWriter.write_node(null, document)
      console.info(`Top node: ${nodeId}`)

      var snapshotDate = '2011-06-01'
      var nodeTree = new NodeTree(knex, nodeId, snapshotDate)
      var treeJson = await nodeTree.jsonTree()
      console.info(`TREE AT ${snapshotDate}`)
      console.info(JSON.stringify(treeJson, null, 2))

      snapshotDate = '2016-01-01'
      nodeTree = new NodeTree(knex, nodeId, snapshotDate)
      treeJson = await nodeTree.jsonTree()
      console.info(`TREE AT ${snapshotDate}`)
      console.info(JSON.stringify(treeJson, null, 2))

      process.exit()
}

main()


//  This works in PSQL
//  update nodes_history set period='[2017-9-11,2017-11-11 22:39:20)' where name='Document 1';
