package org.jvalue.ods.coreservice.pipeline;

import org.jvalue.ods.coreservice.model.*;
import org.jvalue.ods.coreservice.model.event.EventType;
import org.jvalue.ods.coreservice.model.event.PipelineEvent;
import org.jvalue.ods.coreservice.model.notification.NotificationConfig;
import org.jvalue.ods.coreservice.repository.EventRepository;
import org.jvalue.ods.coreservice.repository.PipelineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class PipelineManager {

    private final PipelineRepository pipelineRepository;
    private final EventRepository eventRepository;


    @Autowired
    public PipelineManager(PipelineRepository pipelineRepository, EventRepository eventRepository) {
        this.pipelineRepository = pipelineRepository;
        this.eventRepository = eventRepository;
    }


    @Transactional
    public PipelineConfig createPipeline(PipelineConfig config) {
        PipelineConfig savedConfig = pipelineRepository.save(config);
        eventRepository.save(new PipelineEvent(EventType.PIPELINE_CREATE, savedConfig.getId()));
        return savedConfig;
    }


    public Optional<PipelineConfig> getPipeline(Long id) {
        return pipelineRepository.findById(id);
    }


    public Iterable<PipelineConfig> getAllPipelines() {
        return pipelineRepository.findAll();
    }


    @Transactional
    public void updatePipeline(Long id, PipelineConfig updated) throws IllegalArgumentException {
        PipelineConfig old = pipelineRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pipeline with id " + id + " not found."));

        pipelineRepository.save(applyUpdate(old, updated));
        eventRepository.save(new PipelineEvent(EventType.PIPELINE_UPDATE, id));
    }


    @Transactional
    public void deletePipeline(Long id) {
        pipelineRepository.deleteById(id);
        eventRepository.save(new PipelineEvent(EventType.PIPELINE_DELETE, id));
    }


    @Transactional
    public void deleteAllPipelines() {
        Iterable<PipelineConfig> allPipelines = getAllPipelines();
        pipelineRepository.deleteAll();

        allPipelines.forEach(
                pl -> eventRepository.save(new PipelineEvent(EventType.PIPELINE_DELETE, pl.getId()))
        );
    }

    /**
     * Create an updated PipelineConfig using the full representation of an update. This method ensures that id and creation time remain stable.
     * @param updateConfig the representation of the updated config
     * @return an updated PipelineConfig that has the same id and creationTimestamp as the original one.
     */
    private PipelineConfig applyUpdate(PipelineConfig existing, PipelineConfig updateConfig) {
        PipelineMetadata updatedMetadata = new PipelineMetadata(
                updateConfig.getMetadata().getAuthor(),
                updateConfig.getMetadata().getLicense(),
                updateConfig.getMetadata().getDisplayName(),
                updateConfig.getMetadata().getDescription());
        updatedMetadata.setCreationTimestamp(existing.getMetadata().getCreationTimestamp());

        PipelineConfig updated = new PipelineConfig(
                updateConfig.getDatasourceId(),
                updateConfig.getTransformations(),
                updatedMetadata,
                updateConfig.getNotifications());
        updated.setId(existing.getId());

        return updated;
    }

    public Optional<PipelineEvent> getEvent(Long id) {
        return eventRepository.findById(id);
    }

    public Iterable<PipelineEvent> getEventsAfter(Long id) {
        return eventRepository.getAllByEventIdAfter(id);
    }

    public Iterable<PipelineEvent> getEventsByPipeline(Long pipelineId) {
        return eventRepository.getAllByPipelineId(pipelineId);
    }

    public PipelineEvent getLatestEvent() {
        return eventRepository.findFirstByOrderByEventIdDesc();
    }

    @Transactional
    public NotificationConfig addNotification(long pipelineId, NotificationConfig notificationConfig) {
        PipelineConfig existing = pipelineRepository.findById(pipelineId)
                .orElseThrow(() -> new IllegalArgumentException("Pipeline with id " + pipelineId + " not found."));

        List<NotificationConfig> notificationsBefore = new ArrayList<>(existing.getNotifications());

        existing.addNotification(notificationConfig);

        PipelineConfig savedConfig = pipelineRepository.save(existing);
        eventRepository.save(new PipelineEvent(EventType.PIPELINE_UPDATE, pipelineId));

        return savedConfig.getNotifications().stream()
                .filter(n -> !notificationsBefore.contains(n))
                .findFirst()
                .orElseThrow(IllegalStateException::new);
    }

    @Transactional
    public void removeNotification(long pipelineId, Long notificationId) {
        PipelineConfig existing = pipelineRepository.findById(pipelineId)
                .orElseThrow(() -> new IllegalArgumentException("Pipeline with id " + pipelineId + " not found."));

        NotificationConfig toRemove = existing.getNotifications().stream()
                .filter(n -> n.getNotificationId().equals(notificationId))
                .findFirst()
                .orElseThrow( () -> new IllegalArgumentException("Notification with id " + notificationId + "does not exist for pipeline with id " + pipelineId));

        existing.removeNotification(toRemove);
        pipelineRepository.save(existing);
        eventRepository.save(new PipelineEvent(EventType.PIPELINE_UPDATE, pipelineId));
    }
}
