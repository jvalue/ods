<template>
  <div class="pipeline">
    <v-card>
      <v-card-title>
        <v-btn class="ma-2" color="success" @click="onCreate()">
          Create new pipeline
          <v-icon dark right>
            mdi mdi-pipe
          </v-icon>
        </v-btn>
        <v-btn class="ma-2" @click="loadAll()">
          <v-icon dark>
            mdi mdi-sync
          </v-icon>
        </v-btn>
        <v-spacer />
        <v-text-field
          v-model="search"
          label="Search"
          append-icon="mdi mdi-magnify"
          single-line
          hide-details
        />
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="pipelines"
        :search="search"
        :custom-filter="filterOnlyDisplayName"
        :loading="isLoadingPipelines && isLoadingPipelineStatus"
        class="elevation-1"
      >
        <template v-slot:progress>
          <v-progress-linear indeterminate />
        </template>

        <template #[`item.trigger.interval`]="{ item }">
          {{ getHoursFromMS(item.trigger.interval) }}h:{{
            getMinutesFromMS(item.trigger.interval)
          }}m
        </template>

        <template #[`item.trigger.periodic`]="{ item }">
          <v-switch v-model="item.trigger.periodic" class="ma-2" disabled />
        </template>

        <template #[`item.action`]="{ item }">
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-icon
                v-bind="attrs"
                small
                class="mr-2"
                v-on="on"
                @click="onShowData(item)"
              >
                mdi mdi-database
              </v-icon>
            </template>
            <span>Data</span>
          </v-tooltip>

          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-icon
                v-bind="attrs"
                small
                class="mr-2"
                v-on="on"
                @click="onEdit(item)"
              >
                mdi mdi-pencil
              </v-icon>
            </template>
            <span>Edit</span>
          </v-tooltip>

          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-icon
                v-bind="attrs"
                small
                class="mr-2"
                v-on="on"
                @click="onDelete(item)"
              >
                mdi mdi-delete
              </v-icon>
            </template>
            <span>Delete</span>
          </v-tooltip>

          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-icon
                v-bind="attrs"
                small
                class="mr-2"
                v-on="on"
                @click="onNotifications(item)"
              >
                mdi mdi-alarm
              </v-icon>
            </template>
            <span>Notifications</span>
          </v-tooltip>
        </template>

        <template #[`item.health`]="{ item }">
          <v-icon small :color="pipelineStatus.get(item.id)">
            mdi-water
          </v-icon>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

import Pipeline, { HealthStatus } from './pipeline';
import { PipelineREST } from './pipelineRest';
import { TransformationREST } from './pipelineTransRest';

import {
  convertMillisecondsToHours,
  convertMillisecondsToMinutes,
} from '@/helpers/date-helpers';

@Component({})
export default class PipelineOverview extends Vue {
  private isLoadingPipelines = false;
  private isLoadingPipelineStatus = false;
  private pipelines: Pipeline[] = [];
  private pipelineStatus: Map<number, string> = new Map();

  private headers = [
    { text: 'Id', value: 'id' },
    { text: 'Datasource ID', value: 'datasourceId' },
    { text: 'Pipeline Name', value: 'metadata.displayName', sortable: false }, // Sorting to be implemented
    { text: 'Author', value: 'metadata.author', sortable: false },
    { text: 'Action', value: 'action', sortable: false },
    { text: 'Status', value: 'health', sortable: false },
  ];

  private search = '';

  private async mounted(): Promise<void> {
    await this.loadAll();
  }

  private async loadAll(): Promise<void> {
    try {
      await this.loadPipelines();
      await this.loadPipelineStatus();
    } catch (error) {
      console.error('Failed to load pipeline and/or status', error);
    }
  }

  private getHealthColor(status: HealthStatus): string {
    if (status === HealthStatus.OK) {
      return 'success';
    } else if (status === HealthStatus.WARINING) {
      return 'orange';
    }
    return 'red';
  }

  private onShowData(pipeline: Pipeline): void {
    this.$router
      .push({
        name: 'pipeline-storage-overview',
        params: { storageId: `${pipeline.id}` },
      })
      .catch(error =>
        console.log('Failed to route to pipeline-storage-overview', error),
      );
  }

  private onCreate(): void {
    this.$router
      .push({ name: 'pipeline-new' })
      .catch(error => console.log('Failed to route to pipeline-new', error));
  }

  private onEdit(pipeline: Pipeline): void {
    this.$router
      .push({ name: 'pipeline-edit', params: { pipelineId: `${pipeline.id}` } })
      .catch(error => console.log('Failed to route to pipeline-edit', error));
  }

  private async onDelete(pipeline: Pipeline): Promise<void> {
    await PipelineREST.deletePipeline(pipeline.id);
    await this.loadPipelines();
  }

  private onNotifications(pipeline: Pipeline): void {
    this.$router
      .push({
        name: 'notification-overview',
        params: { pipelineId: `${pipeline.id}` },
      })
      .catch(error =>
        console.log('Failed to route to notification-overview', error),
      );
  }

  private filterOnlyDisplayName(
    value: unknown,
    search: string,
    item: Pipeline,
  ): boolean {
    return (
      value != null &&
      search != null &&
      typeof value === 'string' &&
      item.metadata.displayName
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase())
    );
  }

  private async loadPipelines(): Promise<void> {
    this.isLoadingPipelines = true;
    this.pipelines = await PipelineREST.getAllPipelines();
    this.isLoadingPipelines = false;
  }

  private async loadPipelineStatus(): Promise<void> {
    this.isLoadingPipelineStatus = true;
    const pipelineStates = new Map<number, string>();
    for (const element of this.pipelines) {
      try {
        const transformedData = await TransformationREST.getLatestTransformedData(
          element.id,
        );

        const healthStatus = this.getHealthColor(transformedData.healthStatus);
        pipelineStates.set(element.id, healthStatus);
      } catch (error) {
        console.info(
          `Found no transformation runs for data source ${element.id}`,
        );
      }
    }

    this.pipelineStatus = pipelineStates;
    this.isLoadingPipelineStatus = false;
  }

  private getHoursFromMS(ms: number): number {
    return convertMillisecondsToHours(ms);
  }

  private getMinutesFromMS(ms: number): number {
    return convertMillisecondsToMinutes(ms);
  }
}
</script>
