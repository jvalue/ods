package org.jvalue.ods.adapterservice.datasource;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.jvalue.ods.adapterservice.config.RabbitConfiguration;
import org.jvalue.ods.adapterservice.datasource.event.DatasourceConfigEvent;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;
import org.jvalue.ods.adapterservice.datasource.repository.DatasourceRepository;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class DatasourceManagerTest {

    private final ObjectMapper mapper = new ObjectMapper();
    private final File configFile = new File("src/test/java/org/jvalue/ods/adapterservice/datasource/model/DatasourceConfig.json");

    @Mock
    DatasourceRepository datasourceRepository;

    @Mock
    RabbitTemplate rabbitTemplate;

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
        verify(rabbitTemplate).convertAndSend(RabbitConfiguration.AMPQ_EXCHANGE,
                RabbitConfiguration.AMQP_DATASOURCE_CREATED_TOPIC,
                new DatasourceConfigEvent(123L));
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
        verify(rabbitTemplate).convertAndSend(RabbitConfiguration.AMPQ_EXCHANGE,
                RabbitConfiguration.AMQP_DATASOURCE_UPDATED_TOPIC,
                new DatasourceConfigEvent(123L));
    }

    @Test
    public void testDeleteDatasource() {
        manager.deleteDatasource(123L);

        verify(datasourceRepository).deleteById(123L);
        verify(rabbitTemplate).convertAndSend(RabbitConfiguration.AMPQ_EXCHANGE,
                RabbitConfiguration.AMQP_DATASOURCE_DELETED_TOPIC,
                new DatasourceConfigEvent(123L));
    }

    @Test
    public void testDeleteAllDatasources() throws IOException {
        Datasource config = mapper.readValue(configFile, Datasource.class);

        when(datasourceRepository.findAll()).thenReturn(
                List.of(config, config, config) // add the same config three times with different id's
        );

        manager.deleteAllDatasources();

        verify(datasourceRepository).deleteAll();
        verify(rabbitTemplate, times(3)).convertAndSend(
                RabbitConfiguration.AMPQ_EXCHANGE,
                RabbitConfiguration.AMQP_DATASOURCE_DELETED_TOPIC,
                any(DatasourceConfigEvent.class));
    }

}
