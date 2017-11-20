var Const = require('./constants');

class NodeWriter {
  constructor(knex) {
    this.knex = knex
  }

  createChildrenNodes(parentId, children) {
    var childPromises = []
    for (var i = 0; i < children.length; i++) {
      var child = children[i]
      childPromises.push(this.write_node(parentId, child))
    }
    return Promise.all(childPromises)
  }

  write_node(parentId, params) {
    var now = new Date()
    console.info("Writing record...")
    var objectToInsert = {
      name: params.name,
      node_type: params.node_type
    }
    if (parentId) {
      objectToInsert['parent_id'] = parentId
    }
    if ((!params.period) && (params.created_at)) {
      objectToInsert['period'] = `[${params.created_at},)`
    }
    if (!params.node_type) {
      throw(`node_type not given for ${params.name}`)
    }
    return this.knex(Const.NODES_TABLE).insert(objectToInsert, 'id')
    .then(result => {
      const id = result[0]
      console.info(`Node written: ${params.name} ID: ${id}`)
      if ((params.children) && (params.children.length > 0)) {
        console.info(`Need to add children...`)
        return this.createChildrenNodes(id, params.children).then((childIds) => {
          console.info(`Children found: ${id}   Child count: ${childIds.length}`)
          return Promise.resolve(id)
        })
      } else {
        console.info(`No children for node: ${id}`)
        return Promise.resolve(id)
      }
    })
  }

  createFakeDataNode() {
    let promises = []
    let children = [
      {name: `Section 1`,
        node_type: 'section',
        children: [
          { name: 'Section 1.1',
            node_type: 'entry',
            children: [
              {name: 'Section 1.1.1', node_type: 'entry'},
              {name: 'Section 1.1.2', node_type: 'entry'},
              {name: 'Section 1.1.3', node_type: 'entry'},
              {name: 'Section 1.1.4', node_type: 'entry'}
            ]
          },
          {name: 'Section 1.2',
           node_type: 'entry',
           children: [
            {name: 'Section 1.2.1', node_type: 'section'},
            {name: 'Section 1.2.2', node_type: 'section'},
            {name: 'Section 1.2.3', node_type: 'section'},
            {name: 'Section 1.2.4', node_type: 'section'}
           ]
          },
          {name: 'Section 1.3', node_type: 'section'}
        ]
        },
      { name: `Section 2`,
        node_type: 'section',
        children: [
          {name: 'Section 2.1', node_type: 'section'}
        ]},
      {name: `Section 3`, node_type: 'section'}
      ]
    return this.write_node(null, {name: `Document`, node_type: "document", children: children})
    .then((nodeId) => {
      return Promise.resolve(nodeId)
    });
  }

  updateNode(params) {
    return knex(Const.NODES_HISTORY_TABLE)
      .where('id', params.id)
      .update({
        name: params.name,
        node_type: params.node_type,
        created_at: params.created_at
      }).then(result =>{
        return Promise.resolve(params)
      })
  }

  insertNodeHistory(params) {
    if (!params.id)
      throw "No id"
    if (!params.parent_id)
      params['parent_id'] = null
    return this.knex(Const.NODES_HISTORY_TABLE).insert({
          id: params.id,
          parent_id: params.parent_id,
          name: params.name,
          created_at: params.started_at,
          period: `[${params.started_at},${params.ended_at})`,
          node_type: params.node_type})
    .then(result => {
      params['id'] = result[0]
      return(Promise.resolve(params))
    })
  }

  insertNode(params) {
    if (!params.parent_id)
      params['parent_id'] = null
    return this.knex.insert({
          parent_id: params.parent_id,
          name: params.name,
          created_at: params.started_at,
          period: `[${params.started_at},)`,
          node_type: params.node_type}, 'id')
          .into(Const.NODES_TABLE)
    .then(result => {
      params['id'] = result[0]
      return(Promise.resolve(params))
    })
  }

  insertNodePreceding(newerNode, olderNode) {
    olderNode['id'] = newerNode.id,
    olderNode['ended_at'] = newerNode.started_at
    return this.insertNodeHistory(olderNode)
  }

  addTagToNode(node, tag, started_date) {
    var objectToInsert = {
      node_id: node.id,
      tag_id: tag.id,
      created_at: started_date,
      period: `[${started_date},)`
    }
    return this.knex.insert(objectToInsert, 'id').table(Const.NODES_TAGS_TABLE)
    .then(results => {
      objectToInsert['id'] = results[0]
      return objectToInsert
    })
  }

  addTagToNodePreceding(previousNodeTag, node, tag, started_at) {
    var objectToInsert = {
      id: previousNodeTag.id,
      node_id: node.id,
      tag_id: tag.id,
      created_at: started_at,
      period: `[${started_at},${previousNodeTag.created_at})`
    }
    return this.knex.insert(objectToInsert, 'id').table(Const.NODES_TAGS_HISTORY_TABLE)
    .then(results => {
      objectToInsert['id'] = results[0]
      return objectToInsert
    })
  }


}
module.exports = NodeWriter;
