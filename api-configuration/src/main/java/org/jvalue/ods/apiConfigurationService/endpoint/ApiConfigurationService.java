package org.jvalue.ods.apiConfigurationService.endpoint;

import org.jvalue.ods.apiConfigurationService.APIConfigurationManager;
import org.jvalue.ods.apiConfigurationService.helper.GraphqlQueryFactory;
import org.jvalue.ods.apiConfigurationService.helper.SqlFactory;
import org.jvalue.ods.apiConfigurationService.model.APIConfiguration;
import org.jvalue.ods.apiConfigurationService.model.RemoteSchemaData;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.concurrent.TimeUnit;

import static org.jvalue.ods.apiConfigurationService.helper.GraphqlQueryFactory.createSQLGraphQuery;

@RestController
@RequestMapping("/")
public class ApiConfigurationService implements ApiConfigurationServiceI {

  private static final String HASURA_ADMIN_ENDPOINT = "http://172.17.0.1:7654/v1/query";
  private static final String DEFAULT_SCHEMA = "storage";
  private APIConfigurationManager apiConfigurationManager;

  public ApiConfigurationService (APIConfigurationManager apiConfigurationManager){
    this.apiConfigurationManager = apiConfigurationManager;
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
      untrackTable(schemaName);
      return HttpStatus.OK;
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
      return HttpStatus.OK;
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
    }
  }

  @Override
  @PostMapping("/removeDefaultAPI")
  public HttpStatus removeDefaultAPI(@RequestParam(name = "tableName", required = true) String[] tableNames) {
    try {
      Arrays.stream(tableNames)
            .forEach((String tableName) -> deleteAPIForTable(tableName));
      return HttpStatus.OK;
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Override
  @PostMapping("/initDefaultAPI")
  public HttpStatus initDefaultAPI(@RequestParam(name = "tableName", required = true) String[] tableNames) {
    try {
      Arrays.stream(tableNames)
        .forEach((String tableName) -> createDefaultApiForTable(tableName));
      return HttpStatus.OK;
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Override
  @PostMapping("/addRemoteSchema")
  public HttpStatus addRemoteSchema(@RequestParam(name = "schemaName", required = true) String schemaName,
                                      @RequestParam(name = "url", required = true) String url) {
    try {
      String query = GraphqlQueryFactory.populateQuery(GraphqlQueryFactory.GQLQuery.ADD_REMOTE_SCHEMA, schemaName, url);
      sendQuery(HASURA_ADMIN_ENDPOINT, query);
      return HttpStatus.OK;
    } catch (Exception e) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  @Override
  @PostMapping("/removeRemoteSchema")
  public HttpStatus removeRemoteSchema(@RequestParam(name = "schemaName", required = true) String schemaName){
    try {
      String query = GraphqlQueryFactory.populateQuery(GraphqlQueryFactory.GQLQuery.REMOVE_REMOTE_SCHEMA, schemaName);
      sendQuery(HASURA_ADMIN_ENDPOINT, query);
      return HttpStatus.OK;
    } catch (Exception e) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  @Override
  public APIConfiguration[] getAllConfigs() {
    System.out.println("--- called getAllConfigs");
    ArrayList<APIConfiguration> result = new ArrayList<APIConfiguration>();
    apiConfigurationManager.getAllAPIConfigurations().forEach(result::add);
    APIConfiguration[] array = new APIConfiguration[result.size()];
    result.toArray(array);
    return array;
  }

  @Override
  public HttpStatus deleteAllConfigs() {
    System.out.println("--- called deleteAllConfigs");
    List<APIConfiguration> result = new ArrayList<APIConfiguration>();
    apiConfigurationManager.getAllAPIConfigurations().forEach(result::add);
    result.forEach(x -> this.deleteAPIForTable(String.valueOf(x.getPipelineId())));
    apiConfigurationManager.deleteAllAPIConfigurations();
    return HttpStatus.OK;
  }

  @Override
  public Optional<APIConfiguration> getConfig(Long id) {
    System.out.println("--- called getConfig" + id);
    return apiConfigurationManager.getAPIConfiguration(id);
  }

  @Override
  public APIConfiguration createNewConfig(APIConfiguration config) {
    System.out.println("--- called createNewConfig" + config);
    config.setId(null);
    handleConfiguration(config);
    return apiConfigurationManager.createAPIConfiguration(config);
  }

  @Override
  public APIConfiguration updateConfig(Long id, APIConfiguration config) {
    System.out.println("--- called updateConfig" + config);
    handleConfiguration(config);
    apiConfigurationManager.updateAPIConfiguration(config.getId(), config);
    return config;
  }

  @Override
  public APIConfiguration deleteConfig(Long id) {
    System.out.println("--- called updateConfig" + id);
    APIConfiguration config = apiConfigurationManager.getAPIConfiguration(id).get();
    config.setDefaultAPI(false);
    handleConfiguration(config);
    return config;
  }

  @Override
  public APIConfiguration getConfigByPipeline(Long id) {
    System.out.println("--- called getConfigByPipeline" + id);
//    NOOP
    return new APIConfiguration();
  }

  private void handleConfiguration(APIConfiguration config){
    if(config.getDefaultAPI()){
        //wait for postgres db entry to be created
        createDefaultApiForTable(String.valueOf(config.getPipelineId()));
      for(RemoteSchemaData x: config.getRemoteSchemata()){
        try{
          addRemoteSchema(String.valueOf(config.getPipelineId()), x.getEndpoint());
        }
        catch(Exception e){
          System.out.println(e.getMessage());
        }
      }
    } else if (!config.getDefaultAPI()){
      deleteAPIForTable(String.valueOf(config.getPipelineId()));
    }
  }

  private void untrackTable(String schemaName) {
    try {
      String query = GraphqlQueryFactory.populateQuery(GraphqlQueryFactory.GQLQuery.UNTRACK_TABLE_QUERY, DEFAULT_SCHEMA, schemaName.toLowerCase());
      sendQuery(HASURA_ADMIN_ENDPOINT, query);
    } catch (HttpClientErrorException e) {
      if(e.getMessage().contains("already-untracked")){
        return;
      }
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch(Exception e){
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private void trackTable(String tableName) {
    try {
      String query = GraphqlQueryFactory.populateQuery(GraphqlQueryFactory.GQLQuery.TRACK_TABLE_QUERY_V1, DEFAULT_SCHEMA, tableName.toLowerCase());
      sendQuery(HASURA_ADMIN_ENDPOINT, query);
    } catch (HttpClientErrorException e) {
      if(e.getMessage().contains("already-tracked")){
        return;
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
