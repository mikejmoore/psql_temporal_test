//import * as Const from './data/constants';
let knex = require('knex')(require('./knexfile.js').development)
let bookshelf = require('bookshelf')(knex)
let NodeWriter = require('./data/nodeWriter.js')
let NodeTree = require('./data/nodeTree.js')
const uuidv4 = require('uuid/v4');
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
                  {name: 'Section 1.1.2', node_type: 'entry', created_at: '2011-01-01'},
                  {name: 'Section 1.1.3', node_type: 'entry', created_at: '2012-01-01'},
                  {name: 'Section 1.1.4', node_type: 'entry', created_at: '2012-01-01'}
                 ]
                  }
                ]
              },
              {name: 'Section 1.2',
                 node_type: 'entry',
                 created_at: '2015-01-01',
                 children: [
                  {name: 'Section 1.2.1', node_type: 'section', created_at: '2015-01-01'},
                  {name: 'Section 1.2.2', node_type: 'section', created_at: '2015-01-01'},
                  {name: 'Section 1.2.3', node_type: 'section', created_at: '2015-01-01'},
                  {name: 'Section 1.2.4', node_type: 'section', created_at: '2016-01-01'}
                 ]
                },
               {name: 'Section 1.3', node_type: 'section', created_at: '2011-01-01'}
            ]
       }
      let nodeId = await nodeWriter.write_node(null, document)
      console.info(`Top node: ${nodeId}`)

      await 
      process.exit()
}

main()




//  This works in PSQL
//  update nodes_history set period='[2017-9-11,2017-11-11 22:39:20)' where name='Document 1';
