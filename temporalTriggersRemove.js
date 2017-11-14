//import * as Const from './data/constants';
let knex = require('knex')(require('./knexfile.js').development)
let bookshelf = require('bookshelf')(knex)
let NodeWriter = require('./data/nodeWriter.js')
let NodeTree = require('./data/nodeTree.js')
const uuidv4 = require('uuid/v4');
const Const = require('./data/constants')

nodeWriter = new NodeWriter(knex)




// const TRIGGER_CODE = `
// DROP TRIGGER IF EXISTS versioning_trigger ON nodes;
// ALTER TABLE nodes ALTER period DROP DEFAULT;`


async function main() {
  await knex.raw("DROP TRIGGER IF EXISTS versioning_trigger ON nodes;")
  await knex.raw("ALTER TABLE nodes ALTER period DROP DEFAULT;")
  console.info('Finishing dropping triggers and defaults so that migrations can be performed')
  process.exit()
}

main()
