package org.jvalue.ods.apiConfigurationService.helper;

import org.jvalue.ods.apiConfigurationService.model.PipelineData;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Set;

public class SqlFactory {

  public static final String STORAGE_URL= "http://localhost:9000/api/storage/%s?order=id.desc&limit=1";

  //language=SQL
  private static final String SQL_SCHEMA_CREATION_HEADER =
    "CREATE OR REPLACE VIEW \"storage\".%s AS " +
      "SELECT id, \"timestamp\" ";

  //language=SQL
  private static final String SQL_SCHEMA_CREATION_FIELD = "x.datapoint ->> '%s'::text AS %s ";

  //language=SQL
  private static final String SQL_SCHEMA_CREATION_REST =
    "FROM (WITH a AS " +
      "(SELECT \"3\".id, \"3\".timestamp, jsonb_array_elements(\"3\".data) AS datapoint " +
      "FROM storage.\"3\")" +
      "SELECT a.id, a.timestamp,a.datapoint FROM a) x;";

  //language=SQL
  private static final String SEPERATOR = ",";

  private Set<String> extractColumns(String id){
    RestTemplate restTemplate = new RestTemplate();
    PipelineData[] foo = restTemplate
      .getForObject(String.format(STORAGE_URL, id) , PipelineData[].class);
    System.out.println(foo[0].toString());
    ArrayList data = (ArrayList) foo[0].getData();
    HashMap hm = (HashMap) data.get(1);
    Set keys = hm.keySet();
    return keys;
  }

  public String createViewQueryWithUnpackedFields(String tableName, String viewName){
    Set<String> fields = extractColumns(tableName);
    StringBuilder query = new StringBuilder(String.format(SQL_SCHEMA_CREATION_HEADER, viewName));
    for(String field: fields){
      query.append(SEPERATOR);
      String fieldQuery = String.format(SQL_SCHEMA_CREATION_FIELD, field, field);
      query.append(fieldQuery);
    }
    query.append(SQL_SCHEMA_CREATION_REST);
    return query.toString();
  }
}
