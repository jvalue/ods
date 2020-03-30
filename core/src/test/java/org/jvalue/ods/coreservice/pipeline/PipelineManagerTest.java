package org.jvalue.ods.coreservice.pipeline;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.jvalue.ods.coreservice.model.*;
import org.jvalue.ods.coreservice.model.event.EventType;
import org.jvalue.ods.coreservice.model.event.PipelineEvent;
import org.jvalue.ods.coreservice.model.notification.NotificationConfig;
import org.jvalue.ods.coreservice.model.notification.WebhookNotification;
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

        PipelineConfig expectedConfig = new PipelineConfig(config.getAdapter(), config.getTransformation(), config.getTrigger(), config.getMetadata(), config.getNotifications());
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

        PipelineConfig updated = new PipelineConfig(config.getAdapter(), null, config.getTrigger(), config.getMetadata(), config.getNotifications());
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

    @Test
    public void testAddNotification() throws IOException {
        PipelineConfig pipelineConfig = mapper.readValue(configFile, PipelineConfig.class);
        pipelineConfig.setId(21L);

        when(pipelineRepository.findById(21L)).thenReturn(Optional.of(pipelineConfig));

        NotificationConfig notificationConfig = new WebhookNotification("data.value2 === 1", "http://www.hook.org");

        when(pipelineRepository.save(pipelineConfig)).thenReturn(pipelineConfig);

        manager.addNotification(21L, notificationConfig);

        PipelineConfig result = manager.getPipeline(21L).get();

        assertEquals(2, result.getNotifications().size());
        assertEquals("data.value2 === 1", result.getNotifications().get(1).getCondition());
        assertEquals("http://www.hook.org", ((WebhookNotification) result.getNotifications().get(1)).getUrl());
        verify(eventRepository).save(argThat(event -> event.getEventType().equals("PIPELINE_UPDATE")));
    }

    @Test
    public void testRemoveNotification() throws IOException {
        PipelineConfig pipelineConfig = mapper.readValue(configFile, PipelineConfig.class);
        pipelineConfig.setId(22L);
        pipelineConfig.getNotifications().get(0).setNotificationId(1L);

        when(pipelineRepository.findById(22L)).thenReturn(Optional.of(pipelineConfig));

        manager.removeNotification(22L, 1L);

        PipelineConfig result = manager.getPipeline(22L).get();
        assertEquals(0, result.getNotifications().size());
        verify(eventRepository).save(argThat(event -> event.getEventType().equals("PIPELINE_UPDATE")));
    }
}
