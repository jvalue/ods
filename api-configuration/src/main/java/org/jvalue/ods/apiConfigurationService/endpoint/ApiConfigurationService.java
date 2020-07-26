package org.jvalue.ods.apiConfigurationService.endpoint;

import org.jvalue.ods.apiConfigurationService.helper.GraphqlQueryFactory;
import org.jvalue.ods.apiConfigurationService.helper.SqlFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import static org.jvalue.ods.apiConfigurationService.helper.GraphqlQueryFactory.createSQLGraphQuery;

@RestController
@RequestMapping("/")
public class ApiConfigurationService implements ApiConfigurationServiceI {

  private static final String HASURA_ADMIN_ENDPOINT = "http://172.17.0.1:7654/v1/query";
  private static final String DEFAULT_SCHEMA = "storage";

  public class SpringOutput {
    private String _testOuput = "asda";
    public String gettestOuput() { return this._testOuput; }
  }

  @PostMapping("/exampleActionMalte")
  SpringOutput handler() {
    return new SpringOutput();
  }

  @PostMapping("test")
  public HttpStatus testThis() {
    new SqlFactory().createViewQueryWithUnpackedFields("3", "s");
    return HttpStatus.CONFLICT;
  }

  @Override
  @PostMapping("/deleteAPIForTable")
  public HttpStatus deleteAPIForTable(@RequestParam(name = "tableName", required = true) String tableName) {
    try {
      String schemaName = buildSchemaName(tableName);

//      String formattedQuery = String.format(UNTRACK_TABLE_QUERY, schemaName, tableName);
      String query = GraphqlQueryFactory.populateQuery(GraphqlQueryFactory.GQLQuery.UNTRACK_TABLE_QUERY, schemaName, tableName);
      Object res = sendQuery(HASURA_ADMIN_ENDPOINT, query);
      return HttpStatus.ACCEPTED;
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Override
  @PostMapping("/createDefaultApiForTable")
  public HttpStatus createDefaultApiForTable(@RequestParam(name = "tableName", required = true) String tableName) {
    try {
      String schemaName = buildSchemaName(tableName);
      String sqlQuery = new SqlFactory().createViewQueryWithUnpackedFields(tableName, schemaName);
      sendQuery(HASURA_ADMIN_ENDPOINT, createSQLGraphQuery(sqlQuery));
      trackTable(schemaName);
      return HttpStatus.ACCEPTED;
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
    }
  }

  @Override
  @PostMapping("/removeDefaultAPI")
  public HttpStatus removeDefaultAPI(@RequestParam(name = "tableName", required = true) String tableName) {
    try {
      String schemaName = buildSchemaName(tableName);
      untrackTable(schemaName);
      return HttpStatus.ACCEPTED;
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Override
  @PostMapping("/initDefaultGraphAPI")
  public HttpStatus initDefaultGraphAPI(@RequestParam(name = "tableName", required = true) String[] tableNames) {
    try {
     for(String tableName:tableNames){
       createDefaultApiForTable(tableName);
     }
      return HttpStatus.ACCEPTED;
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Override
  @PostMapping("/addRemoteSchema")
  public HttpStatus addRemoteEndpoint(@RequestParam(name = "schemaName", required = true) String schemaName,
                                      @RequestParam(name = "url", required = true) String url) {
    try {
//      Object res = sendQuery(HASURA_ADMIN_ENDPOINT, query);
//      String formattedQuery = String.format(ADD_REMOTE_SCHEMA, schemaName, url );
      String query = GraphqlQueryFactory.populateQuery(GraphqlQueryFactory.GQLQuery.ADD_REMOTE_SCHEMA, schemaName, url);
      Object res = sendQuery(HASURA_ADMIN_ENDPOINT, query);
      return HttpStatus.ACCEPTED;
    } catch (Exception e) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  @Override
  @PostMapping("/removeRemoteSchema")
  public HttpStatus removeRemoteSchema(@RequestParam(name = "schemaName", required = true) String schemaName){
    try {
      String query = GraphqlQueryFactory.populateQuery(GraphqlQueryFactory.GQLQuery.REMOVE_REMOTE_SCHEMA, schemaName);
      Object res = sendQuery(HASURA_ADMIN_ENDPOINT, query);
//      String formattedQuery = String.format(REMOVE_REMOTE_SCHEMA, schemaName);
//      Object res = sendQuery(HASURA_ADMIN_ENDPOINT, formattedQuery);
      return HttpStatus.ACCEPTED;
    } catch (Exception e) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  private HttpStatus untrackTable(String schemaName) {
    try {
//      String formattedQuery = String.format(UNTRACK_TABLE_QUERY, DEFAULT_SCHEMA, schemaName.toLowerCase());
//      Object res = sendQuery(HASURA_ADMIN_ENDPOINT, formattedQuery);
      String query = GraphqlQueryFactory.populateQuery(GraphqlQueryFactory.GQLQuery.UNTRACK_TABLE_QUERY, DEFAULT_SCHEMA, schemaName.toLowerCase());
      Object res = sendQuery(HASURA_ADMIN_ENDPOINT, query);
      return HttpStatus.ACCEPTED;
    } catch (HttpClientErrorException e) {
      if(e.getMessage().contains("already-untracked")){
        return HttpStatus.ACCEPTED;
      }
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch(Exception e){
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private HttpStatus trackTable(String tableName) {
    try {
//      String formattedQuery = String.format(TRACK_TABLE_QUERY_V1, DEFAULT_SCHEMA, tableName.toLowerCase());
//      Object res = sendQuery(HASURA_ADMIN_ENDPOINT, formattedQuery);
      String query = GraphqlQueryFactory.populateQuery(GraphqlQueryFactory.GQLQuery.TRACK_TABLE_QUERY_V1, DEFAULT_SCHEMA, tableName.toLowerCase());
      Object res = sendQuery(HASURA_ADMIN_ENDPOINT, query);
      return HttpStatus.ACCEPTED;
    } catch (HttpClientErrorException e) {
      if(e.getMessage().contains("already-tracked")){
        return HttpStatus.ACCEPTED;
      }
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch(Exception e){
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private String buildSchemaName(String tableName) {
    return "publicAPI" + tableName;
  }

  private Object sendQuery(String endpoint, String query){
    RestTemplate restTemplate = new RestTemplate();
    Object res = restTemplate.postForEntity(endpoint, query, Object.class);
    return res;
  }
}
