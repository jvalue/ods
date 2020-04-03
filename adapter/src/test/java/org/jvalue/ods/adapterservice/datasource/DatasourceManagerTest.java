package org.jvalue.ods.adapterservice.datasource;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.jvalue.ods.adapterservice.datasource.event.DatasourceEvent;
import org.jvalue.ods.adapterservice.datasource.event.EventType;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;
import org.jvalue.ods.adapterservice.datasource.repository.DatasourceEventRepository;
import org.jvalue.ods.adapterservice.datasource.repository.DatasourceRepository;
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
public class DatasourceManagerTest {

    private final ObjectMapper mapper = new ObjectMapper();
    private final File configFile = new File("src/test/java/org/jvalue/ods/adapterservice/datasource/model/DatasourceConfig.json");

    @Mock
    DatasourceRepository datasourceRepository;

    @Mock
    DatasourceEventRepository eventRepository;

    @InjectMocks
    private DatasourceManager manager;

    @Test
    public void testCreateDatasource() throws IOException {
        Datasource config = mapper.readValue(configFile, Datasource.class);

        Datasource expectedConfig = new Datasource(config.getProtocol(), config.getFormat(), config.getMetadata(), config.getTrigger());
        expectedConfig.setId(123L);

        when(datasourceRepository.save(config)).thenReturn(expectedConfig);

        Datasource result = manager.createDatasource(config);

        assertEquals(expectedConfig, result);
        verify(datasourceRepository).save(config);
        verify(eventRepository).save(argThat(event -> event.getEventType().equals("DATASOURCE_CREATE")));
    }

    @Test
    public void testUpdateDatasource() throws IOException {
        Datasource config = mapper.readValue(configFile, Datasource.class);
        config.setId(123L);


        Datasource updated = new Datasource(config.getProtocol(), config.getFormat(), config.getMetadata(), config.getTrigger());
        updated.setId(123L);

        when(datasourceRepository.findById(123L)).thenReturn(Optional.of(config));

        manager.updateDatasource(123L, updated);

        verify(datasourceRepository).save(updated);
        verify(eventRepository).save(argThat(event -> event.getEventType().equals("DATASOURCE_UPDATE")));
    }

    @Test
    public void testDeleteDatasource() {
        manager.deleteDatasource(123L);

        verify(datasourceRepository).deleteById(123L);
        verify(eventRepository).save(argThat(event -> event.getEventType().equals("DATASOURCE_DELETE")));
    }

    @Test
    public void testDeleteAllDatasources() throws IOException {
        Datasource config = mapper.readValue(configFile, Datasource.class);

        when(datasourceRepository.findAll()).thenReturn(
                List.of(config, config, config) // add the same config three times with different id's
        );

        manager.deleteAllDatasources();

        verify(datasourceRepository).deleteAll();
        verify(eventRepository, times(3)).save(argThat(event -> event.getEventType().equals("DATASOURCE_DELETE")));
    }

    @Test
    public void testGetEvent() {
        DatasourceEvent event = new DatasourceEvent(EventType.DATASOURCE_CREATE, 123L);

        when(eventRepository.findById(123L)).thenReturn(Optional.of(event));

        Optional<DatasourceEvent> result =  manager.getEvent(123L);

        assertEquals(event, result.get());
        verify(eventRepository).findById(123L);
    }

    @Test
    public void testGetEventsAfter() {
        DatasourceEvent first = new DatasourceEvent(EventType.DATASOURCE_CREATE, 1L);
        DatasourceEvent snd = new DatasourceEvent(EventType.DATASOURCE_UPDATE, 1L);
        DatasourceEvent thrd = new DatasourceEvent(EventType.DATASOURCE_CREATE, 2L);
        DatasourceEvent frth = new DatasourceEvent(EventType.DATASOURCE_DELETE, 1L);
        List<DatasourceEvent> events = List.of(first, snd, thrd, frth);

        when(eventRepository.getAllByEventIdAfter(2L)).thenReturn(events.subList(2, events.size()));

        Iterable<DatasourceEvent> result = manager.getEventsAfter(2L);

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
