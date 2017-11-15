
function createTriggerForTable(tableName) {
  return `CREATE TRIGGER versioning_trigger
   BEFORE INSERT OR UPDATE OR DELETE ON ${tableName}
   FOR EACH ROW EXECUTE PROCEDURE versioning(
     'period', '${tableName}_history', true
   );`
}



exports.up = function(knex, Promise) {
  // Don't think knex provides functionality for postgres temporal constructs.  Can use
  // raw postgres schema commands instead.
  return Promise.all([
    knex.schema.raw(
      `
       CREATE EXTENSION IF NOT EXISTS temporal_tables;
       CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

       CREATE TABLE nodes
          (
            id SERIAL PRIMARY KEY,
            parent_id   integer,
            name        text,
            node_type text NOT NULL CHECK (node_type IN ('document', 'section', 'entry')),
            created_at timestamptz NOT NULL DEFAULT current_timestamp,
            period tstzrange NOT NULL DEFAULT tstzrange(current_timestamp, null)
          );

       CREATE UNIQUE INDEX nodes_primary on nodes (id);

       CREATE TABLE nodes_history (LIKE nodes);

       CREATE VIEW nodes_with_history AS
            SELECT * FROM nodes
          UNION ALL
            SELECT * FROM nodes_history;

        CREATE TABLE tags
          (
            id SERIAL PRIMARY KEY,
            name        text NOT NULL,
            category    text NOT NULL,
            created_at timestamptz NOT NULL DEFAULT current_timestamp,
            period tstzrange NOT NULL DEFAULT tstzrange(current_timestamp, null)
          );
        CREATE UNIQUE INDEX tags_primary on tags (id);
        CREATE UNIQUE INDEX tags_name on tags (name);
        CREATE TABLE tags_history (LIKE tags);
        CREATE VIEW tags_with_history AS
             SELECT * FROM tags
           UNION ALL
             SELECT * FROM tags_history;


        CREATE TABLE nodes_tags
          (
            id SERIAL PRIMARY KEY,
            node_id     integer,
            tag_id      integer,
            created_at timestamptz NOT NULL DEFAULT current_timestamp,
            period tstzrange NOT NULL DEFAULT tstzrange(current_timestamp, null)
          );
        CREATE UNIQUE INDEX nodes_tags_primary on nodes_tags (id);
        CREATE TABLE nodes_tags_history (LIKE nodes_tags);
        CREATE VIEW nodes_tags_with_history AS
             SELECT * FROM nodes_tags
           UNION ALL
             SELECT * FROM nodes_tags_history;
        `
    ),
    knex.schema.raw(createTriggerForTable('nodes')),
    knex.schema.raw(createTriggerForTable('tags')),
    knex.schema.raw(createTriggerForTable('nodes_tags'))
  ]);
};


exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.raw('drop table nodes cascade'),
    knex.schema.raw('drop table nodes_history cascade'),
    knex.schema.raw('drop table tags cascade'),
    knex.schema.raw('drop table tags_history cascade'),
    knex.schema.raw('drop table nodes_tags cascade'),
    knex.schema.raw('drop table nodes_tags_history cascade')
  ])
};
