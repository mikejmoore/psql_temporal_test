//import * as Const from './constants';
var Const = require('./constants');


class NodeTree {
  constructor(knex, nodeId, dateString = null) {
    this.knex = knex
    this.nodeId = nodeId
    this.topLevelNode = null
    this.dateString = dateString
  }

  topLevelNode() {
    return this.topLevelNode;
  }

  jsonTree() {
    if (this.dateString) {
      return this.knex.select().whereRaw(`id=? AND period @> '${this.dateString}'::timestamptz`, this.nodeId)
        .table(Const.NODES_WITH_HISTORY).then( results => {
        if (results.length != 1) {
          throw(`Expected one result from query, got: ${results.length}`)
        }
        return this.fillNodeChildren(results[0]).then(nodeJson => {
          this.topLevelNode = nodeJson
          this.addTagsToNode(nodeJson)
          return Promise.resolve(nodeJson)
        })
      })
    } else {
      return this.knex.select().where('id', this.nodeId).table(Const.NODES_TABLE).then( results => {
        if (results.length != 1) {
          throw(`Expected one result from query, got: ${results.length}`)
        }
        return this.fillNodeChildren(results[0]).then(nodeJson => {
          return this.addTagsToNode(nodeJson).then(nodeJson => {
            this.topLevelNode = nodeJson
            return Promise.resolve(nodeJson)
          })
        })
      })
    }
  }



  addTagsToNode(node) {
    if (this.dateString) {
      return this.knex.raw(`
        select nodes_tags.node_id, nodes_tags.tag_id, tags.name
        from nodes_tags_with_history as nodes_tags
        inner join tags_with_history as tags on (nodes_tags.tag_id = tags.id)
        where (nodes_tags.node_id = :node_id:)
        AND (nodes_tags.period @> ':sys_date:'::timestamptz)
        AND  (tags.period @> ':sys_date:'::timestamptz)`,
        {node_id: node.id, sys_date: this.dateString}, 'node_id'
      ).then( results => {
        node['tags'] = results.rows.map((r) => {return r.name})
        return Promise.resolve(node)
      })
    } else {
      return this.knex.select().whereRaw(`node_id=?`, node.id)
        .table(Const.NODES_TAGS_TABLE).then( results => {
          node['tags'] = results
          return Promise.resolve(node)
      })

    }
  }

  fillNodeChildren(node) {
    if (this.dateString) {
      return this.knex.select()
        .whereRaw(`parent_id=? AND period @> '${this.dateString}'::timestamptz`, node.id)
        .table(Const.NODES_WITH_HISTORY)
        .then((childNodes) => {
           if (childNodes.length == 0) {
             let nodeJson = {name: node.name,
                  id: node.id,
                  parent_id: node.parent_id,
                  node_type: node.node_type,
                  children: []}
             return this.addTagsToNode(nodeJson).then(nodeJson => {
               return Promise.resolve(nodeJson)
             })
           } else {
             return this.findChildren(childNodes)
             .then(children => {
               let nodeJson = {
                  name: node.name, id: node.id,
                  parent_id: node.parent_id,
                  node_type: node.node_type,
                  children: children}
                return this.addTagsToNode(nodeJson).then(nodeJson => {
                  return Promise.resolve(nodeJson)
                })
             })
           }
       })
    } else {
      return this.knex.select(['id', 'node_type', 'name', 'parent_id'])
        .where('parent_id', node.id).table(Const.NODES_TABLE)
        .then((childNodes) => {
           console.info(`Node: ${node.id} - Child count: ${childNodes.length}`)
           if (childNodes.length == 0) {
             let nodeJson = {name: node.name,
                  id: node.id,
                  parent_id: node.parent_id,
                  node_type: node.node_type,
                  children: []}
             return Promise.resolve(nodeJson)
           } else {
             return this.findChildren(childNodes)
             .then(children => {
               let nodeJson = {
                  name: node.name, id: node.id,
                  parent_id: node.parent_id,
                  node_type: node.node_type,
                  children: children}
               return Promise.resolve(nodeJson)
             })
           }
       })

    }
  }

  findNodeWithName(nodeName, topNode = null) {
    if (!topNode) {
      topNode = this.topLevelNode;
    }
    let foundNode = null
    if (topNode.name == nodeName) {
      return topNode
    } else {
      if (topNode.children) {
        for (var i = 0; i < topNode.children.length; i++) {
          var child = topNode.children[i]
          if (!foundNode) {
            foundNode = this.findNodeWithName(nodeName, child)
          }
        }
      }
    }
    return foundNode
  }

  findChildren(childNodes) {
    if (childNodes.length == 0) {
      return Promise.all([])
    }
    var childPromises = []
    for (var j = 0; j < childNodes.length; j++) {
       let childNode = childNodes[j]
       childPromises.push(this.fillNodeChildren(childNode))
    }
    return Promise.all(childPromises)
  }

  display() {
    return this.jsonTree()
    .then( jsonTree => {
      console.info(`TREE AT ${this.dateString}`)
      console.info(JSON.stringify(jsonTree, null, 2))
    })
  }

}

module.exports = NodeTree;
