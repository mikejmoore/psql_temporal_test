
To perform migration, and set the created_at and period of current records, need to turn
off temporal triggers and default setting for perio column,  run this:

> node ./temporalTriggersRemove.js

To turn defaults and triggers back on (to allow temporal updates), run this:

> node ./temporalTriggersApply.js
