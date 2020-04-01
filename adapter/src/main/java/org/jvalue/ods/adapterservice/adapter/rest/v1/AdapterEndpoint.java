package org.jvalue.ods.adapterservice.adapter.rest.v1;

import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.AdapterFactory;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.DataBlob;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;

@RestController
@RequestMapping("/")
public class AdapterEndpoint {

    private final AdapterFactory adapterFactory;

    @Autowired
    public AdapterEndpoint(AdapterFactory adapterFactory) {
        this.adapterFactory = adapterFactory;
    }

    @PostMapping("/dataImport")
    public DataBlob.MetaData executeDataImport(@RequestBody AdapterConfig config) {
        try {
          Adapter adapter = adapterFactory.getAdapter(config);
            return adapter.executeJob(config);
        } catch (Exception e) {
            if(e instanceof HttpMessageNotReadableException) {
                System.err.println("Data Import request failed. Malformed Request: " + e.getMessage());
                throw e;
            }
            String location = config.protocolConfig.parameters.get("location").toString();
            if(location != null) {
                System.err.println("Importing data from " + location + " failed.\n" +
                        "Reason: " + e.getClass().getName() + ": " + e.getMessage());
            } else {
                System.err.println("Data Import failed. Reason: " + e.getClass() + ": " +e.getMessage());
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
