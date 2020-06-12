import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import "reflect-metadata"

export interface NotificationConfigRequest {
  pipelineId: number;
  pipelineName: string;
  data: object;
  dataLocation: string;
  condition: string;
  type: string;
}

export interface WebHookConfigRequest extends NotificationConfigRequest{
  url: string;
}

export interface SlackConfigRequest extends NotificationConfigRequest {
  workspaceId: string;
  channelId: string;
  secret: string;
}

export interface FirebaseConfigRequest extends NotificationConfigRequest{
  projectId: string;
  clientEmail: string;
  privateKey: string;
  topic: string;
}

export class NotificationConfig{
  @Column()
  pipelineId!: number;

  @Column()
  pipelineName!: string;

  @Column()
  data!: string;

  @Column()
  dataLocation!: string;

  @Column()
  condition!: string;
}


@Entity()
export class SlackConfig extends NotificationConfig{

  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  workspaceId!: string;

  @Column()
  channelId!: string;

  @Column()
  secret!: string;
}


@Entity()
export class WebHookConfig extends NotificationConfig{

  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  url!: string;
}

@Entity()
export class FirebaseConfig extends NotificationConfig {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  projectId!: string;

  @Column()
  clientEmail!: string;

  @Column()
  privateKey!: string;

  @Column()
  topic!: string;
}