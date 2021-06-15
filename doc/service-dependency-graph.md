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
The following Cypher queries can be used to import a graph model into Neo4j.
There are currently two graph models available. The first shows the actual network connections. The second shows the actual data flow, here the AMQP messages are modeled explicitly as event nodes.

### 1. Model based on network connections
```
CREATE 
  (RabbitMq:Service:MsgBroker {name: 'RabbitMQ'}),
  (Adapter:Service {name: 'Adapter'}),
  (AdapterDb:Service:Database {name: 'Adapter Database'}),
  (AdapterOutboxer:Service {name: 'Adapter Outboxer'}),
  (Scheduler:Service {name: 'Scheduler'}),
  (StorageMq:Service {name: 'StorageMQ'}),
  (Storage:Service {name: 'Storage'}),
  (StorageDb:Service:Database {name: 'Storage Database'}),
  (Pipeline:Service {name: 'Pipeline'}),
  (PipelineDb:Service:Database {name: 'Pipeline Database'}),
  (PipelineOutboxer:Service {name: 'Pipeline Outboxer'}),
  (Notification:Service {name: 'Notification'}),
  (NotificationDb:Service:Database {name: 'Notification Database'}),
  (Traefik:Service {name: 'Edge Router'})

CREATE 
  (Adapter)-[:USES:RPC]->(AdapterDb)

CREATE
  (AdapterOutboxer)-[:USES:SUBSCRIBE]->(AdapterDb),
  (AdapterOutboxer)-[:USES:PUBLISH]->(RabbitMq)

CREATE 
  (Scheduler)-[:USES:SUBSCRIBE]->(RabbitMq),
  (Scheduler)-[:USES:RPC]->(Adapter)

CREATE 
  (StorageMq)-[:USES:SUBSCRIBE]->(RabbitMq),
  (StorageMq)-[:USES:RPC]->(StorageDb)

CREATE
  (Storage)-[:USES]->(StorageDb)

CREATE 
  (Pipeline)-[:USES:SUBSCRIBE]->(RabbitMq),
  (Pipeline)-[:USES:RPC]->(PipelineDb)

CREATE
  (PipelineOutboxer)-[:USES:SUBSCRIBE]->(PipelineDb),
  (PipelineOutboxer)-[:USES:PUBLISH]->(RabbitMq)

CREATE 
  (Notification)-[:USES:SUBSCRIBE]->(RabbitMq),
  (Notification)-[:USES:RPC]->(NotificationDb)

CREATE 
  (Traefik)-[:USES:RPC]->(Adapter),
  (Traefik)-[:USES:RPC]->(Scheduler),
  (Traefik)-[:USES:RPC]->(StorageMq),
  (Traefik)-[:USES:RPC]->(Storage),
  (Traefik)-[:USES:RPC]->(Pipeline),
  (Traefik)-[:USES:RPC]->(Notification),
  (Traefik)-[:USES:RPC]->(RabbitMq)
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
  (Adapter)-[:RPC]->(AdapterDb)

CREATE 
  (Scheduler)-[:RPC]->(Adapter)

CREATE 
  (StorageMq)-[:RPC]->(StorageDb)

CREATE
  (Storage)-[:RPC]->(StorageDb)

CREATE 
  (Pipeline)-[:RPC]->(PipelineDb)

CREATE 
  (Notification)-[:RPC]->(NotificationDb)

CREATE 
  (Traefik)-[:RPC]->(Adapter),
  (Traefik)-[:RPC]->(Scheduler),
  (Traefik)-[:RPC]->(StorageMq),
  (Traefik)-[:RPC]->(Storage),
  (Traefik)-[:RPC]->(Pipeline),
  (Traefik)-[:RPC]->(Notification)

CREATE
  (ImportSuccessEvent:Event {name: 'Import success', topic: 'datasource.execution.success'})-[:PRODUCED_BY]->(Adapter),
  (ImportErrorEvent:Event {name: 'Import error', topic: 'datasource.execution.failed'})-[:PRODUCED_BY]->(Adapter),
  (DatasourceCreatedEvent:Event {name: 'Datasource created', topic: 'datasource.config.created'})-[:PRODUCED_BY]->(Adapter),
  (DatasourceUpdatedEvent:Event {name: 'Datasource updated', topic: 'datasource.config.updated'})-[:PRODUCED_BY]->(Adapter),
  (DatasourceDeletedEvent:Event {name: 'Datasource deleted', topic: 'datasource.config.deleted'})-[:PRODUCED_BY]->(Adapter)

CREATE
  (TransformSuccessEvent:Event {name: 'Transform success', topic: 'pipeline.execution.success'})-[:PRODUCED_BY]->(Pipeline),
  (TransformErrorEvent:Event {name: 'Transform error', topic: 'pipeline.execution.error'})-[:PRODUCED_BY]->(Pipeline),
  (PipelineCreatedEvent:Event {name: 'Pipeline created', topic: 'pipeline.config.created'})-[:PRODUCED_BY]->(Pipeline),
  (PipelineUpdatedEvent:Event {name: 'Pipeline updated', topic: 'pipeline.config.updated'})-[:PRODUCED_BY]->(Pipeline),
  (PipelineDeletedEvent:Event {name: 'Pipeline deleted', topic: 'pipeline.config.deleted'})-[:PRODUCED_BY]->(Pipeline)

CREATE
  (Scheduler)-[:CONSUMES]->(DatasourceCreatedEvent),
  (Scheduler)-[:CONSUMES]->(DatasourceUpdatedEvent),
  (Scheduler)-[:CONSUMES]->(DatasourceDeletedEvent)

CREATE
  (StorageMa)-[:CONSUMES]->(TransformSuccessEvent),
  (StorageMa)-[:CONSUMES]->(PipelineCreatedEvent),
  (StorageMa)-[:CONSUMES]->(PipelineUpdatedEvent),
  (StorageMa)-[:CONSUMES]->(PipelineDeletedEvent)

CREATE
  (Pipeline)-[:CONSUMES]->(ImportSuccessEvent)

CREATE
  (Notification)-[:CONSUMES]->(ImportSuccessEvent)
```

## Simple queries

Get all services and all relationships
```
MATCH (a) RETURN a
```

Get services and dependent services
```
MATCH (s1: Service)-[:USES]->(s2:Service) 
RETURN s1,s2
```

Get all produced events and its potential consumers
```
MATCH (event:Event)-[:PRODUCED_BY]->(producer: Service)
OPTIONAL MATCH (consumer: Service)-[:CONSUMES]->(event)
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

The graph can be created using a [native projection](https://neo4j.com/docs/graph-data-science/current/management-ops/native-projection) by specifying the Nodes and the relationships: The following example creates a graph called `service-dependencies-graph` that contains all `Service` nodes and the `USES` relationship:
```
CALL gds.graph.create('service-dependencies-graph', 'Service', 'USES')
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
