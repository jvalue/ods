const { Pool } = require('pg')

const { POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USERNAME, POSTGRES_PASSWORD, POSTGRES_DATABASE, OUTBOX_TABLE_NAME} = require('./env')

const POOL_CONFIG = {
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  user: POSTGRES_USERNAME,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DATABASE,
}

const CREATE_OUTBOX_TABLE_SQL = `
CREATE TABLE "${OUTBOX_TABLE_NAME}"(
  id uuid not null constraint outbox_pk primary key default gen_random_uuid(),
  routing_key varchar(255) not null,
  payload jsonb
);
`

const INSERT_INTO_OUTBOX_TABLE_SQL = `
INSERT INTO "${OUTBOX_TABLE_NAME}"
  ("routing_key", "payload")
  VALUES ($1, $2)
  RETURNING id
`

class OutboxDatabase {
  async init() {
    this.pool = new Pool(POOL_CONFIG)
    this.pool.on('error', (err) => console.log('Idle postgres connection errored:', err.message))
    await this.pool.query(CREATE_OUTBOX_TABLE_SQL)
  }

  async insertEvent(routingKey, payload) {
    const { rows } = await this.pool.query(INSERT_INTO_OUTBOX_TABLE_SQL, [routingKey, payload])
    return rows[0].id;
  }

  async insertEvents(rows) {
    const response = await this.pool.query(this.buildInsertEventsStatement(rows))
    return response.rows.map(r => r.id);
  }

  buildInsertEventsStatement(rows) {
    const params = []
    const chunks = []
    for(let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const valuesClause = []
      params.push(row[0])
      valuesClause.push('$' + params.length)
      params.push(row[1])
      valuesClause.push('$' + params.length)
      chunks.push('(' + valuesClause.join(', ') + ')')
    }
    return {
      text: `INSERT INTO "${OUTBOX_TABLE_NAME}" ("routing_key", "payload") VALUES ${chunks.join(', ')} RETURNING id`,
      values: params
    }
  }

  async close() {
    await this.pool.end()
  }
}

module.exports = {
  OutboxDatabase
}
