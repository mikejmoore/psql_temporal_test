//import * as Const from './constants';
var Const = require('./constants');


class NodeTree {
  constructor(knex, nodeId) {
    this.knex = knex
    this.nodeId = nodeId
    this.topLevelNode = null
  }

  topLevelNode() {
    return this.topLevelNode;
  }

  jsonTree() {
    return this.knex.select('id', 'node_type', 'name', 'parent_id').where('id', this.nodeId).table(Const.NODES_TABLE).then( results => {
      if (results.length != 1) {
        throw(`Expected one result from query, got: ${results.length}`)
      }
      console.info(`Found top level node: ${results[0].id}`)
      return this.fillNodeChildren(results[0]).then(nodeJson => {
        this.topLevelNode = nodeJson
        return Promise.resolve(this)
      })
    })
  }

  fillNodeChildren(node) {
    console.info(`fillNodeChildren for: ${node.id}`)
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

}

module.exports = NodeTree;
