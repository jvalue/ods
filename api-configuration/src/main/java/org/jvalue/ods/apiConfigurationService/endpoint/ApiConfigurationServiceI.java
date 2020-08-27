package org.jvalue.ods.apiConfigurationService.endpoint;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

public interface ApiConfigurationServiceI {

  /**
   * removes the api for a specified table
   *
   * @param tableName specfies the name of table whose API shall be deleted
   * @return
   */
    @PostMapping("/deleteAPIForTable")
    HttpStatus deleteAPIForTable(@RequestParam(name = "tableName", required = true) String tableName);

  /**
   * creates default API for specified table
   *
   * @param tableName specfies the name of table whose API shall be created
   * @return
   */
    @PostMapping("/createDefaultApiForTable")
    HttpStatus createDefaultApiForTable(@RequestParam(name = "tableName", required = true) String tableName);

  /**
   * removes default graph API for given tables
   *
   * @param tableNames specfies the names of tables whose API shall be removed
   * @return
   */
    @PostMapping("/removeDefaultAPI")
    HttpStatus removeDefaultAPI(@RequestParam(name = "tableName", required = true) String[] tableNames);

  /**
   * creates default graph API for given tables
   *
   * @param tableNames tableNames specfies the names of tables whose API shall be created
   * @return
   */
    @PostMapping("/initDefaultGraphAPI")
    HttpStatus initDefaultAPI(@RequestParam(name = "tableName", required = true) String[] tableNames);

  /**
   * extends an existing schema with a remote graphql Server endpoint
   *
   * @param schemaName specifies the name of the schema that is to be extended
   * @param url specifies the location of the remote server
   * @return
   */
    @PostMapping("/addRemoteSchema")
    HttpStatus addRemoteSchema(@RequestParam(name = "schemaName", required = true) String schemaName,
                                 @RequestParam(name = "url", required = true) String url);

  /**
   * removes specific remote extension of schema
   * @param schemaName
   * @return
   */
    @PostMapping("/removeRemoteSchema")
    HttpStatus removeRemoteSchema(@RequestParam(name = "schemaName", required = true) String schemaName);

}
