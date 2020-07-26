package org.jvalue.ods.apiConfigurationService.endpoint;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

public interface ApiConfigurationServiceI {
    @PostMapping("/deleteAPIForTable")
    HttpStatus deleteAPIForTable(@RequestParam(name = "tableName", required = true) String tableName);

    @PostMapping("/createDefaultApiForTable")
    HttpStatus createDefaultApiForTable(@RequestParam(name = "tableName", required = true) String tableName);

    @PostMapping("/removeDefaultAPI")
    HttpStatus removeDefaultAPI(@RequestParam(name = "tableName", required = true) String tableName);

    @PostMapping("/initDefaultGraphAPI")
    HttpStatus initDefaultGraphAPI(@RequestParam(name = "tableName", required = true) String[] tableNames);

    @PostMapping("/addRemoteSchema")
    HttpStatus addRemoteEndpoint(@RequestParam(name = "schemaName", required = true) String schemaName,
                                 @RequestParam(name = "url", required = true) String url);

    @PostMapping("/removeRemoteSchema")
    HttpStatus removeRemoteSchema(@RequestParam(name = "schemaName", required = true) String schemaName);
}
