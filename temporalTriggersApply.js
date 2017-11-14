//import * as Const from './data/constants';
let knex = require('knex')(require('./knexfile.js').development)
let bookshelf = require('bookshelf')(knex)
let NodeWriter = require('./data/nodeWriter.js')
let NodeTree = require('./data/nodeTree.js')
const uuidv4 = require('uuid/v4');
const Const = require('./data/constants')

nodeWriter = new NodeWriter(knex)




const TRIGGER_CODE = `
CREATE EXTENSION IF NOT EXISTS temporal_tables;
CREATE TRIGGER versioning_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON nodes
  FOR EACH ROW EXECUTE PROCEDURE versioning(
    'period', 'nodes_history', true
  );
ALTER TABLE nodes ALTER period SET DEFAULT tstzrange(current_timestamp, null);`


async function main() {
  result = await knex.raw(TRIGGER_CODE)
  process.exit()
}

main()




//  This works in PSQL
//  update nodes_history set period='[2017-9-11,2017-11-11 22:39:20)' where name='Document 1';
