var Const = require('./constants');

class NodeDate {
  constructor(knex) {
      this.knex = knex
  }

  findNodeChildrenOnDate(parentNodeId, dateStr) {
    var query = `SELECT * FROM ${Const.NODES_HISTORY_TABLE}
      WHERE parent_id = ${parentNodeId} AND period @> '${dateStr}'::timestamptz`
    return this.knex.raw(query)
    .then((result) => {
      return Promise.resolve(result.rows[0])
    })
  }

  findNodeOnDate(nodeId, dateStr, findTree = true) {
    var query = `SELECT * FROM ${Const.NODES_VIEW}
      WHERE id = ${nodeId} AND period @> '${dateStr}'::timestamptz`
    return this.knex.raw(query)
    .then((result) => {
      var nodeJson = result.rows[0]
      if (findTree) {
        return this.findNodeChildrenOnDate(nodeJson.id, dateStr)
        .then((children) => {
            nodeJson['children'] = children
            return Promise.resolve(nodeJson)
        })
      } else {
        return Promise.resolve(nodeJson)
      }
    })
  }
}

module.exports = NodeDate;
