package org.jvalue.ods.coreservice.rest.v1;

import org.jvalue.ods.coreservice.model.PipelineEvent;
import org.jvalue.ods.coreservice.pipeline.PipelineManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.constraints.NotNull;
import java.util.List;

@RestController
@RequestMapping("/events")
public class EventsEndpoint {

    private final PipelineManager pipelineManager;

    @Autowired
    public EventsEndpoint(PipelineManager pipelineManager) {
        this.pipelineManager = pipelineManager;
    }

    @GetMapping("/{id}")
    public PipelineEvent getEvent(@NotNull @PathVariable Long id) {
        return pipelineManager.getEvent(id)
                .orElseThrow( () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Could not find event with id " + id));
    }

    @GetMapping
    public Iterable<PipelineEvent> getEvents(@RequestParam(value = "after", defaultValue = "0") Long after) {
        return pipelineManager.getEventsAfter(after);
    }

    @GetMapping("/pipeline/{id}")
    public Iterable<PipelineEvent> getEventsByPipeline(@NotNull @PathVariable Long id) {
        return pipelineManager.getEventsByPipeline(id);
    }

    @GetMapping("/latest")
    public PipelineEvent getLatestEvent() {
        return pipelineManager.getLatestEvent();
    }
}
