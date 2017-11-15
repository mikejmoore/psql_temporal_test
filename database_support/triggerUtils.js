
const TRIGGER_CODE = `
CREATE TRIGGER versioning_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON nodes
  FOR EACH ROW EXECUTE PROCEDURE versioning(
    'period', 'nodes_history', true
  );
ALTER TABLE nodes ALTER period SET DEFAULT tstzrange(current_timestamp, null);

CREATE TRIGGER versioning_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON tags
  FOR EACH ROW EXECUTE PROCEDURE versioning(
    'period', 'tags_history', true
  );
ALTER TABLE tags ALTER period SET DEFAULT tstzrange(current_timestamp, null);

CREATE TRIGGER versioning_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON nodes_tags
  FOR EACH ROW EXECUTE PROCEDURE versioning(
    'period', 'nodes_tags_history', true
  );
ALTER TABLE nodes_tags ALTER period SET DEFAULT tstzrange(current_timestamp, null);
`

exports.applyTriggers = function(knex) {
  return knex.raw(TRIGGER_CODE)
}

exports.removeTriggers = function(knex) {
  return Promise.all([
    knex.raw("DROP TRIGGER IF EXISTS versioning_trigger ON nodes;"),
    knex.raw("ALTER TABLE nodes ALTER period DROP DEFAULT;"),

    knex.raw("DROP TRIGGER IF EXISTS versioning_trigger ON tags;"),
    knex.raw("ALTER TABLE tags ALTER period DROP DEFAULT;"),

    knex.raw("DROP TRIGGER IF EXISTS versioning_trigger ON nodes_tags;"),
    knex.raw("ALTER TABLE nodes_tags ALTER period DROP DEFAULT;")
  ])
}
