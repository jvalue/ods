package org.jvalue.ods.adapterservice.rest.v1;

import org.jvalue.ods.adapterservice.repository.DataBlobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/data")
public class DataEndpoint {

  private final DataBlobRepository blobRepository;

  @Autowired
  public DataEndpoint(DataBlobRepository blobRepository) {
    this.blobRepository = blobRepository;
  }

  @GetMapping(value = "/{id}", produces = "application/json")
  public String getData(@PathVariable() Long id) {
    return blobRepository.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No data stored with id " + id))
      .getData();
  }

}
