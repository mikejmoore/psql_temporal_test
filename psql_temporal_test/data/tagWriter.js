var Const = require('./constants');

class TagWriter {
  constructor(knex) {
      this.knex = knex
  }

  writeTag(params) {
    var objectToInsert = {
      name: params.name,
      category: params.category,
      created_at: params.started_at,
      period: `[${params.started_at},)`
    }
    return this.knex(Const.TAGS_TABLE).insert(objectToInsert, 'id')
    .then(results => {
      params['id'] = results[0]
      return params
    })
  }

  findOrCreateTag(params) {
    console.info("findOrCreateTag")
    return this.knex.select()
      .whereRaw('name = ? AND category = ?', [params.name, params.category])
      .table(Const.TAGS_TABLE)
    .then( results => {
      if (results.length == 0) {
        return this.writeTag(params)
      } else {
        return results[0]
      }
    }).catch(e => {
      Promise.reject(e)
    })

  }
}

module.exports = TagWriter;
