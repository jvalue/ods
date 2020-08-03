import { Pool, PoolConfig, PoolClient, QueryResult } from "pg"

import PipelineConfig from "./model/pipelineConfig";
import PipelineConfigRepository from "./pipelineConfigRepository";

const POSTGRES_HOST = process.env.POSTGRES_HOST!;
const POSTGRES_PORT = +process.env.POSTGRES_PORT!;
const POSTGRES_USER = process.env.POSTGRES_USER!;
const POSTGRES_PW = process.env.POSTGRES_PW!;
const POSTGRES_DB = process.env.POSTGRES_DB!;
const POSTGRES_SCHEMA = process.env.POSTGRES_SCHEMA!;
const POSTGRES_TABLE = "PipelineConfigs";

const TABLE_CREATION_STATEMENT = `
  CREATE TABLE IF NOT EXISTS "${POSTGRES_SCHEMA}"."${POSTGRES_TABLE}" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "datasourceId" bigint NOT NULL,
  "func" varchar NOT NULL,
  "author" varchar,
  "displayName" varchar NOT NULL,
  "license" varchar,
  "description" varchar,
  "createdAt" timestamp,
  CONSTRAINT "Data_pk_${POSTGRES_SCHEMA}_${POSTGRES_TABLE}" PRIMARY KEY (id)
)`
const INSERT_STATEMENT = `
  INSERT INTO "${POSTGRES_SCHEMA}"."${POSTGRES_TABLE}"
  ("datasourceId", "func", "author", "displayName", "license", "description", "createdAt")
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING *`
const UPDATE_STATEMENT = `
  UPDATE "${POSTGRES_SCHEMA}"."${POSTGRES_TABLE}"
  SET "datasourceId"=$2, "func"=$3, "author"=$4, "displayName"=$5, "license"=$6, "description"=$7
  WHERE id=$1`
const GET_STATEMENT = `
  SELECT * FROM "${POSTGRES_SCHEMA}"."${POSTGRES_TABLE}" WHERE id = $1`
const GET_ALL_STATEMENT = `
  SELECT * FROM "${POSTGRES_SCHEMA}"."${POSTGRES_TABLE}"`
const GET_ALL_BY_DATASOURCEID_STATEMENT = `
  SELECT * FROM "${POSTGRES_SCHEMA}"."${POSTGRES_TABLE}" WHERE datasourceId = $1`
const DELETE_STATEMENT = `
  DELETE FROM "${POSTGRES_SCHEMA}"."${POSTGRES_TABLE}" WHERE id = $1 RETURNING *`
  const DELETE_ALL_STATEMENT = `
    DELETE FROM "${POSTGRES_SCHEMA}"."${POSTGRES_TABLE}" RETURNING *`

export default class PostgresPipelineConfigRepository implements PipelineConfigRepository {

  private connectionPool?: Pool = undefined


  /**
   * Initializes the connection to the database.
   * @param retries:  Number of retries to connect to the database
   * @param backoffMs:  Time in ms to backoff before next connection retry
   * @returns reject promise on failure to connect
   */
  public async init(retries: number, backoffMs: number): Promise<void> {
    console.debug('Initializing databse connection')

    const poolConfig : PoolConfig = {
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      user: POSTGRES_USER,
      password: POSTGRES_PW,
      database: POSTGRES_DB,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
    console.debug(`Connecting to database with config:\n${JSON.stringify(poolConfig)}`)

    // try to establish connection
    for (let i = 1; i <= retries; i++) {
        console.info(`Initiliazing database connection (${i}/${retries})`)
        let client
        try {
          const connectionPool = new Pool(poolConfig)
          client = await connectionPool.connect()
          await client.query(TABLE_CREATION_STATEMENT)
          this.connectionPool = connectionPool
          console.info(`Successfully established database connection`)
          break
        } catch (error) {
          await this.sleep(backoffMs);
          continue
        } finally {
          if (client) {
            client.release()
          }
        }
    }

    if (!this.connectionPool) {
        return Promise.reject("Connection to databse could not be established.")
    }

    console.info('Sucessfully established connection to database.')
    return Promise.resolve()
  }

  private sleep(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
  }

  private assertInitialized(): Promise<void> {
    if (!this.connectionPool) {
      return Promise.reject("No connnection pool available")
    } else {
      return Promise.resolve()
    }
  }

  private toPipelineConfig(dbResult: any): PipelineConfig {
    return {
      id: +dbResult["id"],
      datasourceId: +dbResult["datasourceId"],
      transformation: {
        func: dbResult["func"]
      },
      metadata: {
        author: dbResult["author"],
        displayName: dbResult["displayName"],
        license: dbResult["license"],
        description: dbResult["description"],
        creationTimestamp: dbResult["createdAt"]
      }
    }
  }

  private toPipelineConfigs(resultSet: QueryResult): PipelineConfig[] {
    const configs: PipelineConfig[] = []
    for(const row of resultSet.rows) {
      const config = this.toPipelineConfig(row)
      configs.push(config)
    }
    return configs
  }

  private async executeQuery(query: string, args: any[]): Promise<QueryResult> {
    console.debug(`Executing query "${query}" with values ${JSON.stringify(args)}`)
    await this.assertInitialized()

    let client!: PoolClient
    try {
        client = await this.connectionPool!.connect()
        const resultSet = await client.query(query, args)
        console.debug(`Query led to ${resultSet.rowCount} results`)
        return resultSet
    } catch (error) {
        console.error(`Failed to execute query: ${error}`)
        return Promise.reject(error)
    } finally {
        if (client) {
            client.release()
        }
    }
  }

  async create(config: PipelineConfig): Promise<PipelineConfig> {
    delete config.id  // id not under control of client
    config.metadata.creationTimestamp = new Date()

    const values = [
       config.datasourceId,
       config.transformation.func,
       config.metadata.author,
       config.metadata.displayName,
       config.metadata.license,
       config.metadata.description,
       config.metadata.creationTimestamp
    ];
    const { rows } = await this.executeQuery(INSERT_STATEMENT, values)
    return Promise.resolve(this.toPipelineConfig(rows[0]))
  }

  async get(id: number): Promise<PipelineConfig | undefined> {
    const resultSet = await this.executeQuery(GET_STATEMENT, [id])
    const content = this.toPipelineConfigs(resultSet)
    if(!content || !content[0]) {
      return undefined
    }
    return Promise.resolve(content[0])
  }

  async getAll(): Promise<PipelineConfig[]> {
    const resultSet = await this.executeQuery(GET_ALL_STATEMENT, [])
    const content = this.toPipelineConfigs(resultSet)
    return Promise.resolve(content)
  }

  async getByDatasourceId(datasourceId: number): Promise<PipelineConfig[]> {
    const resultSet = await this.executeQuery(GET_ALL_BY_DATASOURCEID_STATEMENT, [datasourceId])
    const content = this.toPipelineConfigs(resultSet)
    return Promise.resolve(content)
  }
  async update(id: number, config: PipelineConfig): Promise<void> {
    const values = [
      id,
      config.datasourceId,
      config.transformation.func,
      config.metadata.author,
      config.metadata.displayName,
      config.metadata.license,
      config.metadata.description
    ];
    const result = await this.executeQuery(UPDATE_STATEMENT, values)
    if(result.rowCount == 0) {
      return Promise.reject(`Could not find config with ${id} to update`)
    }
    return Promise.resolve()
  }

  async delete(id: number): Promise<PipelineConfig> {
    const result = await this.executeQuery(DELETE_STATEMENT, [id])
    const content = this.toPipelineConfigs(result)
    if(result.rowCount == 0) {
      return Promise.reject(`Could not find config with ${id} to delete`)
    }
    return Promise.resolve(content[0])
  }

  async deleteAll(): Promise<PipelineConfig[]> {
    const result = await this.executeQuery(DELETE_ALL_STATEMENT, [])
    const content = this.toPipelineConfigs(result)
    return Promise.resolve(content)
  }
}
