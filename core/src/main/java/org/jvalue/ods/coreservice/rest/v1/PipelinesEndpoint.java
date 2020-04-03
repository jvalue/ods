package org.jvalue.ods.coreservice.rest.v1;

import org.jvalue.ods.coreservice.model.notification.NotificationConfig;
import org.jvalue.ods.coreservice.model.PipelineConfig;
import org.jvalue.ods.coreservice.pipeline.PipelineManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.validation.Valid;
import java.net.URI;


@RestController
@RequestMapping("/pipelines")
public class PipelinesEndpoint {

    private final PipelineManager pipelineManager;

    @Autowired
    public PipelinesEndpoint(PipelineManager pipelineManager) {
        this.pipelineManager = pipelineManager;
    }

    /**
     * Returns all pipelines.
     * @param datasourceId if defined, only return pipelines that are dependend on datasource with id
     * @return all pipelines, if datasourceId defined: only dependend ones on datasource with id
     */
    @GetMapping
    public Iterable<PipelineConfig> getPipelines(@RequestParam(name = "datasourceId", required = false) Long datasourceId) {
        if (datasourceId == null) {
            return pipelineManager.getAllPipelines();
        } else {
            return pipelineManager.getAllPipelinesByDatasourceId(datasourceId);
        }
    }

    @GetMapping("/{id}")
    public PipelineConfig getPipeline(@PathVariable Long id) {
        return pipelineManager.getPipeline(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Could not find pipeline with id " + id));
    }

    @PostMapping
    public ResponseEntity<PipelineConfig> addPipeline(@Valid @RequestBody PipelineConfig config) {
          config.setId(null); // id not under control of client

          PipelineConfig savedConfig = pipelineManager.createPipeline(config);

          URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                  .path("/{id}")
                  .buildAndExpand(savedConfig.getId())
                  .toUri();

          return ResponseEntity.created(location).body(savedConfig);
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updatePipeline(
            @PathVariable Long id,
            @Valid @RequestBody PipelineConfig updateConfig) {
        try {
            pipelineManager.updatePipeline(id, updateConfig);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pipeline needs to exist before updating", e);
        }
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePipeline(@PathVariable Long id) {
        pipelineManager.deletePipeline(id);
    }

    @DeleteMapping("/")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAllPipelines() {
        pipelineManager.deleteAllPipelines();
    }

    @PostMapping("/{pipelineId}/notifications")
    public NotificationConfig addNotification(
            @PathVariable Long pipelineId,
            @Valid @RequestBody NotificationConfig notificationConfig) {
        try {
            return pipelineManager.addNotification(pipelineId, notificationConfig);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pipeline not found", e);
        }
    }

    @DeleteMapping("/{pipelineId}/notifications/{notificationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeNotification(
        @PathVariable Long pipelineId,
        @PathVariable Long notificationId) {
        try {
            pipelineManager.removeNotification(pipelineId, notificationId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pipeline or notification not found", e);
        }
    }

}
