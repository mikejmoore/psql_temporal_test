let knex = require('knex')(require('./knexfile.js').development)
const triggerUtils = require('./database_support/triggerUtils')

async function main() {
  triggerUtils.applyTriggers(knex)
  process.exit()
}

main()
