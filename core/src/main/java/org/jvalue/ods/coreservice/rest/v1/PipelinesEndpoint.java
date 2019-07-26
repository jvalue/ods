package org.jvalue.ods.coreservice.rest.v1;

import org.jvalue.ods.coreservice.model.PipelineConfig;
import org.jvalue.ods.coreservice.repository.PipelineRepository;
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

    private final PipelineRepository pipelineRepository;

    @Autowired
    public PipelinesEndpoint(PipelineRepository pipelineRepository) {
        this.pipelineRepository = pipelineRepository;
    }

    @GetMapping
    public Iterable<PipelineConfig> getPipelines() {
        return pipelineRepository.findAll();
    }

    @GetMapping("/{id}")
    public PipelineConfig getPipeline(@PathVariable Long id) {
        return pipelineRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Could not find pipeline with id " + id));
    }

    @PostMapping
	public ResponseEntity<PipelineConfig> addPipeline(@Valid @RequestBody PipelineConfig config) {
        config.setId(null); // id not under control of client
        PipelineConfig savedConfig = pipelineRepository.save(config);

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
        PipelineConfig oldConfig = pipelineRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Could not find pipeline with id " + id + ". Can only update existing pipelines."));

        pipelineRepository.save(oldConfig.applyUpdate(updateConfig));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity deletePipeline(@PathVariable Long id) {
        pipelineRepository.deleteById(id);

        return ResponseEntity.ok().build();
    }
}
