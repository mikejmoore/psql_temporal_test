

function historyTriggerFunction(tableName) {
  var historyTableName = `${tableName}_history`;

  sql = `
  CREATE OR REPLACE FUNCTION ${tableName}_history_trigger()
    returns trigger language plpgsql as $function$
    DECLARE
       old_range      tstzrange;
       new_period      tstzrange;
       saved_new_period tstzrange;
       history_range   tstzrange;
       primary_id      integer;
       last_history_record record;
   begin
       saved_new_period = new.period;
       if tg_op = 'DELETE' then
           insert into ${historyTableName}
           select old.*;
           old_range = old.period;
           primary_id = old.id;
           return old;
       elsif tg_op = 'INSERT' then
          return new;
       else
          old.period = tstzrange(lower(old.period), current_timestamp);
          insert into ${historyTableName}
          select old.*;
          new.period = tstzrange(upper(old.period), null);
          return new;
       end if;
   end; $function$;

   CREATE TRIGGER ${tableName}_history_trigger
                  BEFORE INSERT OR UPDATE OR DELETE ON ${tableName}
                  FOR EACH ROW EXECUTE PROCEDURE ${tableName}_history_trigger();
  `
  console.info(`SQL: ${sql}`)
  return(sql)
}




exports.up = function(knex, Promise) {
  // Don't think knex provides functionality for postgres temporal constructs.  Can use
  // raw postgres schema commands instead.
  return Promise.all([
    knex.schema.raw(
      `
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

       ${historyTriggerFunction('nodes')}

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

        ${historyTriggerFunction('tags')}


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

        ${historyTriggerFunction('nodes_tags')}
        `
    ),
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
