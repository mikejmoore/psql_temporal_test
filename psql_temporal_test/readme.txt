Easy way to start postgres with temporal extension, use docker (note that user and password are set here):

> docker run --name postgres -p 5432:5432 -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -d eddhannay/alpine-postgres-temporal-tables:latest

Create the database:

> createdb documents_dev -h 127.0.0.1

> knex migrate:latest

To perform data migration from old db, and set the created_at and period of current records, need to turn
off temporal triggers and default setting for perio column,  run this:

> node ./temporalTriggersRemove.js

To turn defaults and triggers back on (to allow temporal updates), run this:

> node ./temporalTriggersApply.js


Demo to create node tree and read it back into json:
> node temporalNodesDemo.js


> knex migrate:rollback
