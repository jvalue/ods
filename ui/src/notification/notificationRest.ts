import axios from 'axios';

import { NOTIFICATION_SERVICE_URL } from '@/env';
import NotificationConfig, {
  NotificationParameters,
  NotificationType,
} from '@/notification/notificationConfig';

/**
 * Axios instance with default headers and base url.
 * The option transformResponse is set to an empty array
 * because of explicit JSON.parser call with custom reviver.
 */
const http = axios.create({
  baseURL: `${NOTIFICATION_SERVICE_URL}`,
  headers: { 'Content-Type': 'application/json' },
  transformResponse: [],
});

export async function getAllByPipelineId(
  pipelineId: number,
): Promise<NotificationConfig[]> {
  const response = await http.get(`/configs?pipelineId=${pipelineId}`);
  const notifications = JSON.parse(response.data) as NotificationApiReadModel[];
  return fromApiReadModels(notifications);
}

export async function getById(id: number): Promise<NotificationConfig> {
  const response = await http.get(`/configs/${id}`);
  const notificationApiModel = JSON.parse(
    response.data,
  ) as NotificationApiReadModel;
  return fromApiReadModel(notificationApiModel);
}

export async function create(
  notificationConfig: NotificationConfig,
): Promise<NotificationConfig> {
  const apiModel = toApiWriteModel(notificationConfig);

  const response = await http.post('/configs', JSON.stringify(apiModel));
  const notificationApiModel = JSON.parse(
    response.data,
  ) as NotificationApiReadModel;
  return fromApiReadModel(notificationApiModel);
}

export async function update(
  notificationConfig: NotificationConfig,
): Promise<void> {
  const id = notificationConfig.id;
  const apiModel = toApiWriteModel(notificationConfig);

  return await http.put(`/configs/${id}`, JSON.stringify(apiModel));
}

export async function remove(
  notificationConfig: NotificationConfig,
): Promise<void> {
  const id = notificationConfig.id;

  return await http.delete(`/configs/${id}`);
}

interface NotificationApiReadModel extends NotificationApiWriteModel {
  id: number;
}

interface NotificationApiWriteModel {
  pipelineId: number;
  condition: string;
  type: ApiNotificationType;
  parameter: NotificationParameters;
}

type ApiNotificationType = 'WEBHOOK' | 'SLACK' | 'FCM';

function toApiWriteModel(
  notification: NotificationConfig,
): NotificationApiWriteModel {
  return {
    pipelineId: notification.pipelineId,
    condition: notification.condition,
    type: notification.type,
    parameter: notification.parameters,
  };
}

function fromApiReadModel(
  notificationApiModel: NotificationApiReadModel,
): NotificationConfig {
  return {
    id: notificationApiModel.id,
    pipelineId: notificationApiModel.pipelineId,
    condition: notificationApiModel.condition,
    type: NotificationType[notificationApiModel.type],
    parameters: notificationApiModel.parameter,
  };
}

function fromApiReadModels(
  notificationApiModels: NotificationApiReadModel[],
): NotificationConfig[] {
  return notificationApiModels.map(x => fromApiReadModel(x));
}
