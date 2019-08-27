package org.jvalue.ods.coreservice.pipeline;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.jvalue.ods.coreservice.model.EventType;
import org.jvalue.ods.coreservice.model.PipelineConfig;
import org.jvalue.ods.coreservice.model.PipelineEvent;
import org.jvalue.ods.coreservice.repository.EventRepository;
import org.jvalue.ods.coreservice.repository.PipelineRepository;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class PipelineManagerTest {

    private final ObjectMapper mapper = new ObjectMapper();
    private final File configFile = new File("src/test/java/org/jvalue/ods/coreservice/model/PipelineConfig.json");

    @Mock
    PipelineRepository pipelineRepository;

    @Mock
    EventRepository eventRepository;

    @InjectMocks
    private PipelineManager manager;

    @Test
    public void testCreatePipeline() throws IOException {
        PipelineConfig config = mapper.readValue(configFile, PipelineConfig.class);

        PipelineConfig expectedConfig = new PipelineConfig(config.getAdapter(), config.getTransformations(), config.getTrigger(), config.getMetadata());
        expectedConfig.setId(123L);

        when(pipelineRepository.save(config)).thenReturn(expectedConfig);

        PipelineConfig result = manager.createPipeline(config);

        assertEquals(expectedConfig, result);
        verify(pipelineRepository).save(config);
        verify(eventRepository).save(argThat(event -> event.getEventType().equals("PIPELINE_CREATE")));
    }

    @Test
    public void testUpdatePipeline() throws IOException {
        PipelineConfig config = mapper.readValue(configFile, PipelineConfig.class);
        config.setId(123L);

        PipelineConfig updated = new PipelineConfig(config.getAdapter(), Collections.emptyList(), config.getTrigger(), config.getMetadata());
        updated.setId(123L);

        when(pipelineRepository.findById(123L)).thenReturn(Optional.of(config));

        manager.updatePipeline(123L, updated);

        verify(pipelineRepository).save(updated);
        verify(eventRepository).save(argThat(event -> event.getEventType().equals("PIPELINE_UPDATE")));
    }

    @Test
    public void testDeletePipeline() {
        manager.deletePipeline(123L);

        verify(pipelineRepository).deleteById(123L);
        verify(eventRepository).save(argThat(event -> event.getEventType().equals("PIPELINE_DELETE")));
    }

    @Test
    public void testDeleteAllPipelines() throws IOException {
        PipelineConfig config = mapper.readValue(configFile, PipelineConfig.class);

        when(pipelineRepository.findAll()).thenReturn(
                List.of(config, config, config) // add the same config three times with different id's
        );

        manager.deleteAllPipelines();

        verify(pipelineRepository).deleteAll();
        verify(eventRepository, times(3)).save(argThat(event -> event.getEventType().equals("PIPELINE_DELETE")));
    }

    @Test
    public void testGetEvent() {
        PipelineEvent event = new PipelineEvent(EventType.PIPELINE_CREATE, 123L);

        when(eventRepository.findById(123L)).thenReturn(Optional.of(event));

        Optional<PipelineEvent> result =  manager.getEvent(123L);

        assertEquals(event, result.get());
        verify(eventRepository).findById(123L);
    }

    @Test
    public void testGetEventsAfter() {
        PipelineEvent first = new PipelineEvent(EventType.PIPELINE_CREATE, 1L);
        PipelineEvent snd = new PipelineEvent(EventType.PIPELINE_UPDATE, 1L);
        PipelineEvent thrd = new PipelineEvent(EventType.PIPELINE_CREATE, 2L);
        PipelineEvent frth = new PipelineEvent(EventType.PIPELINE_DELETE, 1L);
        List<PipelineEvent> events = List.of(first, snd, thrd, frth);

        when(eventRepository.getAllByEventIdAfter(2L)).thenReturn(events.subList(2, events.size()));

        Iterable<PipelineEvent> result = manager.getEventsAfter(2L);

        assertEquals(List.of(thrd, frth), result);
        verify(eventRepository).getAllByEventIdAfter(2L);
    }

    @Test
    public void testGetLatestEvent() {
        when(eventRepository.findFirstByOrderByEventIdDesc()).thenReturn(null);

        manager.getLatestEvent();

        verify(eventRepository).findFirstByOrderByEventIdDesc();
    }
}
