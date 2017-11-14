
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
            period tstzrange NOT NULL
          );

       CREATE UNIQUE INDEX nodes_primary on nodes (id);

       CREATE TABLE nodes_history (LIKE nodes);

       CREATE VIEW nodes_with_history AS
            SELECT * FROM nodes
          UNION ALL
            SELECT * FROM nodes_history;

        CREATE EXTENSION IF NOT EXISTS temporal_tables;

        ALTER TABLE nodes ALTER period SET DEFAULT tstzrange(current_timestamp, null);

        CREATE TABLE tags
          (
            id SERIAL PRIMARY KEY,
            name        text,
            created_at timestamptz NOT NULL DEFAULT current_timestamp,
            period tstzrange NOT NULL DEFAULT tstzrange(current_timestamp, null)
          );
        CREATE UNIQUE INDEX tags_primary on tags (id);
        CREATE UNIQUE INDEX tags_name on tags (name);
        CREATE TABLE tags_history (LIKE nodes);

        CREATE TABLE nodes_tags
          (
            id SERIAL PRIMARY KEY,
            node_id     integer,
            tag_id      integer,
            created_at timestamptz NOT NULL DEFAULT current_timestamp,
            period tstzrange NOT NULL DEFAULT tstzrange(current_timestamp, null)
          );
        CREATE UNIQUE INDEX nodes_tags_primary on nodes_tags (id);
        CREATE TABLE nodes_tags_history (LIKE nodes);
      `
      // CREATE TRIGGER versioning_trigger
      //    BEFORE INSERT OR UPDATE OR DELETE ON nodes_tags
      //    FOR EACH ROW EXECUTE PROCEDURE versioning(
      //      'period', 'nodes_tags_history', true
      //    );

    ),
    knex.schema.raw(createTriggerForTable('nodes')),
    knex.schema.raw(createTriggerForTable('tags')),
    knex.schema.raw(createTriggerForTable('nodes_tags'))
  ]);
};


exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('nodes'),
    knex.schema.dropTable('nodes_history'),
    knex.schema.dropTable('tags'),
    knex.schema.dropTable('tags_history'),
    knex.schema.dropTable('nodes_tags'),
    knex.schema.dropTable('nodes_tags_history')
  ])
};
