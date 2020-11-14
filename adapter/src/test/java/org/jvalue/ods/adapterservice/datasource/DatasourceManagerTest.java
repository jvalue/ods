package org.jvalue.ods.adapterservice.datasource;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.Format;
import org.jvalue.ods.adapterservice.adapter.ProtocolEnum;
import org.jvalue.ods.adapterservice.adapter.model.DataBlob;
import org.jvalue.ods.adapterservice.datasource.api.amqp.AmqpPublisher;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;
import org.jvalue.ods.adapterservice.datasource.model.RuntimeParameters;
import org.jvalue.ods.adapterservice.datasource.repository.DatasourceRepository;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;
import org.springframework.web.client.RestClientException;

import java.io.File;
import java.io.IOException;
import java.text.ParseException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.jvalue.ods.adapterservice.adapter.Format.JSON;
import static org.jvalue.ods.adapterservice.adapter.ProtocolEnum.HTTP;
import static org.jvalue.ods.adapterservice.datasource.TestHelper.generateDatasource;
import static org.jvalue.ods.adapterservice.datasource.TestHelper.generateParameterizableDatasource;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class DatasourceManagerTest {

    private final ObjectMapper mapper = new ObjectMapper();
    private final File configFile = new File("src/test/java/org/jvalue/ods/adapterservice/datasource/model/DatasourceConfig.json");

    @Mock
    DatasourceRepository datasourceRepository;

    @Mock
    AmqpPublisher amqpPublisher;

    @Mock
    Adapter adapter;

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
        verify(amqpPublisher).publishCreation(result);
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
        verify(amqpPublisher).publishUpdate(updated);
    }

    @Test
    public void testDeleteDatasource() throws IOException {
        Datasource config = mapper.readValue(configFile, Datasource.class);
        when(datasourceRepository.findById(123L)).thenReturn(Optional.of(config));
        manager.deleteDatasource(123L);

        verify(datasourceRepository).deleteById(123L);
        verify(amqpPublisher).publishDeletion(config);
    }

    @Test
    public void testDeleteAllDatasources() throws IOException {
        Datasource config = mapper.readValue(configFile, Datasource.class);

        when(datasourceRepository.findAll()).thenReturn(
                List.of(config, config, config) // add the same config three times with different id's
        );

        manager.deleteAllDatasources();

        verify(datasourceRepository).deleteAll();
        verify(amqpPublisher, times(3))
                .publishDeletion(config);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testTriggerForNotExistingDatasource() {
        when(datasourceRepository.findById(anyLong())).thenReturn(Optional.empty());

        manager.trigger(1L, null);
    }

    @Test
    public void testTriggerWithoutRuntimeParameters() throws ParseException {
        Datasource datasource = generateDatasource(ProtocolEnum.HTTP, Format.JSON, "location");
        when(datasourceRepository.findById(1L)).thenReturn(Optional.of(datasource));
        when(adapter.executeJob(datasource.toAdapterConfig(null))).thenReturn(
                new DataBlob("{\"hallo\":\"hello\"}"));

        DataBlob.MetaData result = manager.trigger(1L, null);

        verify(amqpPublisher).publishImportSuccess(1L, "{\"hallo\":\"hello\"}");
        assertEquals(result.getLocation(), "/data/null");
        assertNull(result.getId());
    }

    @Test
    public void testTriggerWithRuntimeParameters() throws ParseException {
        Datasource datasource = generateParameterizableDatasource(
                HTTP,
                JSON,
                "http://www.professional-test-url.com/{userId}/{dataId}",
                Map.of("userId", "1", "dataId", "123"));


        when(datasourceRepository.findById(2L)).thenReturn(Optional.of(datasource));

        RuntimeParameters runtimeParameters = new RuntimeParameters(Map.of(
                "userId", "42"
        ));

        when(adapter.executeJob(datasource.toAdapterConfig(runtimeParameters))).thenReturn(
                new DataBlob("{\"hallo\":\"hello\"}"));

        DataBlob.MetaData result = manager.trigger(2L, runtimeParameters);

        verify(amqpPublisher).publishImportSuccess(2L, "{\"hallo\":\"hello\"}");
        assertEquals(result.getLocation(), "/data/null");
        assertNull(result.getId());
    }

    @Test(expected = RestClientException.class)
    public void testTriggerPublishesFailingImport() throws ParseException {
        Datasource datasource = generateDatasource(ProtocolEnum.HTTP, Format.JSON, "location");

        when(datasourceRepository.findById(3L)).thenReturn(Optional.of(datasource));

        when(adapter.executeJob(datasource.toAdapterConfig(null)))
                .thenThrow(new RestClientException("Do not upset the elders of the internet!"));

        manager.trigger(3L, null);

        verify(amqpPublisher).publishImportFailure(3L, "Do not upset the elders of the internet!");
    }
}
