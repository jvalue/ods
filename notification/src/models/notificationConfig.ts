import { Entity,  Column,  PrimaryGeneratedColumn } from 'typeorm'

export enum CONFIG_TYPE{
  WEBHOOK = "WEBHOOK",
  SLACK = "SLACK",
  FCM = "FCM"
}


export class NotificationConfig{
  @Column()
  pipelineId!: number;

  @Column()
  pipelineName!: string;

  @Column()
  dataLocation!: string;

  @Column()
  condition!: string;
}

export class NotficationConfigRequest extends NotificationConfig{
  type!: CONFIG_TYPE
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