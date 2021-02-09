# Microservice dependency graph modeling with Neo4j

## What is Neo4j

[Neo4j](https://neo4j.com) itself is a graph database. Neo4j also provides the powerfull graph query language [Cypher](https://neo4j.com/developer/cypher) and a [Neo4j Browser](https://neo4j.com/developer/neo4j-browser) to edit, query and visualize your data in a browser.

## How to use Neo4j

Neo4j can be run in a docker container. Just run the following command to start Neo4j in a docker container:

```
docker run --name neo4j -p 7474:7474 -p 7687:7687 -d --env='NEO4J_AUTH=neo4j/testPwd' --env='NEO4JLABS_PLUGINS=[\"apoc\",\"graph-data-science\"]' neo4j:4.1
```

This start a Neo4j database and you can access the Neo4j browser on `localhost:7474`. The database is already setup with a basic authentication with username `neo4j` and the password `testPwd`. The [apoc](https://neo4j.com/labs/apoc) and [graph data science library](https://neo4j.com/docs/graph-data-science/current) plugin are added to allow advanced queries and analyses.

## Import the ODS service dependency data
The following Cypher queries can be used to import the two models in to Neo4j.
There are currently two graph models available. The first shows the actual network connections. The second shows the actual data flow, here the AMQP messages are modeled explicitly as event nodes.

### 1. Model based on network connections
```
CREATE 
  (RabbitMq:Service:MsgBroker {name: 'RabbitMQ'}),
  (Adapter:Service {name: 'Adapter'}),
  (AdapterDb:Service:Database {name: 'Adapter Database'}),
  (Scheduler:Service {name: 'Scheduler'}),
  (StorageMq:Service {name: 'StorageMQ'}),
  (Storage:Service {name: 'Storage'}),
  (StorageDb:Service:Database {name: 'Storage Database'}),
  (Pipeline:Service {name: 'Pipeline'}),
  (PipelineDb:Service:Database {name: 'Pipeline Database'}),
  (Notification:Service {name: 'Notification'}),
  (NotificationDb:Service:Database {name: 'Notification Database'}),
  (Traefik:Service {name: 'Edge Router'})

CREATE 
  (Adapter)-[:USES_SYNC]->(RabbitMq),
  (Adapter)-[:USES_SYNC]->(AdapterDb)

CREATE 
  (Scheduler)-[:USES_ASYNC]->(RabbitMq),
  (Scheduler)-[:USES_SYNC]->(Adapter)

CREATE 
  (StorageMq)-[:USES_ASYNC]->(RabbitMq),
  (StorageMq)-[:USES_SYNC]->(StorageDb)

Create (Storage)-[:USES_SYNC]->(StorageDb)

CREATE 
  (Pipeline)-[:USES_SYNC]->(RabbitMq),
  (Pipeline)-[:USES_ASYNC]->(RabbitMq),
  (Pipeline)-[:USES_SYNC]->(PipelineDb)

CREATE 
  (Notification)-[:USES_ASYNC]->(RabbitMq),
  (Notification)-[:USES_SYNC]->(NotificationDb)

CREATE 
  (Traefik)-[:USES_SYNC]->(Adapter),
  (Traefik)-[:USES_SYNC]->(Scheduler),
  (Traefik)-[:USES_SYNC]->(StorageMq),
  (Traefik)-[:USES_SYNC]->(Storage),
  (Traefik)-[:USES_SYNC]->(Pipeline),
  (Traefik)-[:USES_SYNC]->(Notification),
  (Traefik)-[:USES_SYNC]->(RabbitMq)
```

### 1. Model based on data flow
```
CREATE 
  (Adapter:Service {name: 'Adapter'}),
  (AdapterDb:Service:Database {name: 'Adapter Database'}),
  (Scheduler:Service {name: 'Scheduler'}),
  (StorageMq:Service {name: 'StorageMQ'}),
  (Storage:Service {name: 'Storage'}),
  (StorageDb:Service:Database {name: 'Storage Database'}),
  (Pipeline:Service {name: 'Pipeline'}),
  (PipelineDb:Service:Database {name: 'Pipeline Database'}),
  (Notification:Service {name: 'Notification'}),
  (NotificationDb:Service:Database {name: 'Notification Database'}),
  (Traefik:Service {name: 'Edge Router'})

CREATE 
  (Adapter)-[:USES]->(AdapterDb)

CREATE 
  (Scheduler)-[:USES]->(Adapter)

CREATE 
  (StorageMq)-[:USES]->(StorageDb)

Create (Storage)-[:USES]->(StorageDb)

CREATE 
  (Pipeline)-[:USES]->(PipelineDb)

CREATE 
  (Notification)-[:USES]->(NotificationDb)

CREATE 
  (Traefik)-[:USES]->(Adapter),
  (Traefik)-[:USES]->(Scheduler),
  (Traefik)-[:USES]->(StorageMq),
  (Traefik)-[:USES]->(Storage),
  (Traefik)-[:USES]->(Pipeline),
  (Traefik)-[:USES]->(Notification)

CREATE
  (Adapter)-[:PRODUCES]->(ImportSuccess:Event {name: 'Import success', topic: 'datasource.execution.success'}),
  (Adapter)-[:PRODUCES]->(ImportError:Event {name: 'Import error', topic: 'datasource.execution.failed'}),
  (Adapter)-[:PRODUCES]->(DatasourceCreated:Event {name: 'Datasource created', topic: 'datasource.config.created'}),
  (Adapter)-[:PRODUCES]->(DatasourceUpdated:Event {name: 'Datasource updated', topic: 'datasource.config.updated'}),
  (Adapter)-[:PRODUCES]->(DatasourceDeleted:Event {name: 'Datasource deleted', topic: 'datasource.config.deleted'})

CREATE
  (Pipeline)-[:PRODUCES]->(TransformSuccess:Event {name: 'Transform success', topic: 'pipeline.execution.success'}),
  (Pipeline)-[:PRODUCES]->(TransformError:Event {name: 'Transform error', topic: 'pipeline.execution.error'}),
  (Pipeline)-[:PRODUCES]->(PipelineCreated:Event {name: 'Pipeline created', topic: 'pipeline.config.created'}),
  (Pipeline)-[:PRODUCES]->(PipelineUpdated:Event {name: 'Pipeline updated', topic: 'pipeline.config.updated'}),
  (Pipeline)-[:PRODUCES]->(PipelineDeleted:Event {name: 'Pipeline deleted', topic: 'pipeline.config.deleted'})

CREATE
  (DatasourceCreated)-[:CONSUMED_BY]->(Scheduler),
  (DatasourceUpdated)-[:CONSUMED_BY]->(Scheduler),
  (DatasourceDeleted)-[:CONSUMED_BY]->(Scheduler)

CREATE
  (TransformSuccess)-[:CONSUMED_BY]->(StorageMq),
  (PipelineCreated) -[:CONSUMED_BY]->(StorageMq),
  (PipelineUpdated) -[:CONSUMED_BY]->(StorageMq),
  (PipelineDeleted) -[:CONSUMED_BY]->(StorageMq)

CREATE
  (ImportSuccess)-[:CONSUMED_BY]->(Pipeline)

CREATE
  (ImportSuccess)-[:CONSUMED_BY]->(Notification)
```

## Simple queries

Get all services and all relationships
```
MATCH (a) RETURN a
```

Get services and dependent services
```
MATCH (s1: Service)-[:USES_ASYNC|USES_SYNC]->(s2:Service) 
RETURN s1,s2
```

Get all produced events and its potential consumers
```
MATCH (producer: Service)-[:PRODUCES]->(event:Event)
OPTIONAL MATCH (event)-[:CONSUMED_BY]->(consumer: Service)
RETURN producer, event, consumer
```

Find all cycles
```
MATCH (m1)-[]->(m2), cyclePath=shortestPath((m2)-[*]->(m1))
WITH m1, nodes(cyclePath) as cycle
WHERE id(m1) = apoc.coll.max([node in cycle | id(node)])
RETURN m1, cycle
```

## Advanced queries
The advanced queries are using the [graph data science library](https://neo4j.com/docs/graph-data-science/current). The graph algorithms run on a graph model which is a projection of the Neo4j graph data model. A graph projection can be seen as a view over the stored graph, containing only analytically relevant, potentially aggregated, topological and property information. The graph projections are stored entirely in-memory. 

The graph can be created using a [native projection](https://neo4j.com/docs/graph-data-science/current/management-ops/native-projection) by specifying the Nodes and the relationships: The following example creates a graph called `service-dependencies-graph` that contains all `Service` nodes and the `USES_SYNC` and `USES_ASYNC` relationship:
```
CALL gds.graph.create('service-dependencies-graph', 'Service', ['USES_SYNC', 'USES_ASYNC'])
```

The graph can also be created using a [Cypher projection](https://neo4j.com/docs/graph-data-science/current/management-ops/cypher-projection). The following example creates a graph called `service-events-graph` that contains the event producing and consumption relationship:
```
CALL gds.graph.create.cypher(
  'service-events-graph',
  'MATCH (n: Service)-[:PRODUCES]->() RETURN id(n) AS id UNION MATCH ()-[:CONSUMED_BY]->(n: Service) RETURN id(n) AS id',
  'MATCH (p: Service)-[:PRODUCES]->(e:Event)-[:CONSUMED_BY]->(c: Service) RETURN id(p) AS source, id(c) AS target, count(e) AS count'
)
```

### Centrality algorithms

[PageRank](https://neo4j.com/docs/graph-data-science/current/algorithms/page-rank)
```
CALL gds.pageRank.stream('<insert-graph-name-here>') 
YIELD nodeId, score 
RETURN gds.util.asNode(nodeId).name AS name, score 
ORDER BY score DESC
```

[Betweenness Centrality](https://neo4j.com/docs/graph-data-science/current/algorithms/betweenness-centrality)
```
CALL gds.betweenness.stream('<insert-graph-name-here>') 
YIELD nodeId, score 
RETURN gds.util.asNode(nodeId).name AS name, score 
ORDER BY score DESC
```

### Community detection algorithms
[Louvain](https://neo4j.com/docs/graph-data-science/current/algorithms/louvain)
```
CALL gds.louvain.stream('<insert-graph-name-here>')
YIELD nodeId, communityId, intermediateCommunityIds
RETURN gds.util.asNode(nodeId).name AS name, communityId, intermediateCommunityIds
ORDER BY communityId, name
```

[Label Propagation](https://neo4j.com/docs/graph-data-science/current/algorithms/label-propagation)
```
CALL gds.labelPropagation.stream('<insert-graph-name-here>')
YIELD nodeId, communityId
RETURN gds.util.asNode(nodeId).name AS name, communityId
ORDER BY communityId, name
```

[Local Clustering Coefficient](https://neo4j.com/docs/graph-data-science/current/algorithms/local-clustering-coefficient) This algorithm requires an undirected graph.
```
CALL gds.graph.create('undirected-graph', 'Service', {USES: {orientation: 'UNDIRECTED'}})

CALL gds.localClusteringCoefficient.stream('undirected-graph')
YIELD nodeId, localClusteringCoefficient
RETURN gds.util.asNode(nodeId).name AS name, localClusteringCoefficient
ORDER BY localClusteringCoefficient DESC
```

### Similarity algorithms
[Node Similarity](https://neo4j.com/docs/graph-data-science/current/algorithms/node-similarity)
```
CALL gds.nodeSimilarity.stream('<insert-graph-name-here>')
YIELD node1, node2, similarity
RETURN gds.util.asNode(node1).name AS n1, gds.util.asNode(node2).name AS n2, similarity
ORDER BY similarity DESCENDING, n1, n2
```

### Path finding algorithms
The graph data science library contains also many path finding algorithms:
- [Minimum Weight Spanning Tree](https://neo4j.com/docs/graph-data-science/current/alpha-algorithms/minimum-weight-spanning-tree)
- [Shortest Path (Dijkstra's algorithm)](https://neo4j.com/docs/graph-data-science/current/alpha-algorithms/shortest-path)
- [A*](https://neo4j.com/docs/graph-data-science/current/alpha-algorithms/a_star)
- [Breadth First Search](https://neo4j.com/docs/graph-data-science/current/algorithms/bfs)
- [Depth First Search](https://neo4j.com/docs/graph-data-science/current/algorithms/dfs)
