package org.jvalue.ods.adapterservice.datasource.rest.v1;

import org.jvalue.ods.adapterservice.datasource.DatasourceManager;
import org.jvalue.ods.adapterservice.datasource.event.DatasourceEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.constraints.NotNull;

@RestController
@RequestMapping("/datasources/events")
public class EventsEndpoint {

    private final DatasourceManager datasourceManager;

    @Autowired
    public EventsEndpoint(DatasourceManager datasourceManager) {
        this.datasourceManager = datasourceManager;
    }

    @GetMapping("/{id}")
    public DatasourceEvent getEvent(@NotNull @PathVariable Long id) {
        return datasourceManager.getEvent(id)
                .orElseThrow( () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Could not find event with id " + id));
    }

    @GetMapping
    public Iterable<DatasourceEvent> getEvents(@RequestParam(value = "after", defaultValue = "0") Long after) {
        return datasourceManager.getEventsAfter(after);
    }

    @GetMapping("/datasource/{id}")
    public Iterable<DatasourceEvent> getEventsByDatasource(@NotNull @PathVariable Long id) {
        return datasourceManager.getEventsByDatasource(id);
    }

    @GetMapping("/latest")
    public DatasourceEvent getLatestEvent() {
        return datasourceManager.getLatestEvent();
    }
}
