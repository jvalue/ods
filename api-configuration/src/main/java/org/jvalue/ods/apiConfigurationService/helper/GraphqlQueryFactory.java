package org.jvalue.ods.apiConfigurationService.helper;

import org.json.JSONArray;
import org.json.JSONObject;

public class GraphqlQueryFactory {

  public enum GQLQuery{

    TRACK_TABLE_QUERY_V2(
      new JSONObject()
      .put("type", "track_table")
      .put("version", 2)
      .put("args", new JSONObject()
        .put("configuration", new JSONObject()
          .put("custom_root_fields",
                 new JSONObject()
              .put("select", "%sGeneratedApi")))
      .put("schema", "%s")
        .put("table", "%s")
      ).toString()),

    TRACK_TABLE_QUERY_V1(
      new JSONObject()
      .put("type", "track_table")
      .put("args", new JSONObject()
        .put("table", new JSONObject()
          .put("schema", "%s")
          .put("name", "%s"))
      ).toString()),

    UNTRACK_TABLE_QUERY(
      new JSONObject()
      .put("type", "untrack_table")
      .put("args", new JSONObject()
        .put("table", new JSONObject()
          .put("schema", "%s")
          .put("name", "%s"))
      .put("cascade", "true")
      ).toString()),

    ADD_REMOTE_SCHEMA(
      new JSONObject()
      .put("type","add_remote_schema")
      .put("args", new JSONObject()
        .put("name", "%s")
        .put("definition", new JSONObject()
          .put("url", "%s")
          .put("headers", new JSONArray().put(
            new JSONObject()
              .put("name", "X-Server-Request-From")
              .put("value", "Hasura")))
      .put("forward_client_headers", false)
          .put("timeout_seconds", 60))
      ).toString()),

    REMOVE_REMOTE_SCHEMA(
      new JSONObject()
      .put("type","remove_remote_schema")
      .put("args", new JSONObject()
        .put("name", "%s")
      ).toString()),

    EXECUTE_SQL_QUERY(
      new JSONObject()
        .put("type", "run_sql")
        .put("args", new JSONObject()
          .put("sql", "%s")
        ).toString());

    public final String query;

    private GQLQuery(String query) {
      this.query = query;
    }
  }

 public static String populateQuery(GQLQuery query, String... arguments ){
    return String.format(query.query, arguments);
 }

 public static String createSQLGraphQuery(String sqlQuery){
    String exSqlQuery =
      new JSONObject()
        .put("type", "run_sql")
        .put("args", new JSONObject()
          .put("sql", sqlQuery)
        ).toString();
    return exSqlQuery;
  }

}
