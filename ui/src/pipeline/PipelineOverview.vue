<template>
  <div class="pipeline">
    <v-card>
      <v-card-title>

        <v-btn
          class="ma-2"
          color="success"
          @click="onCreatePipeline()"
        >
          Create new pipeline
          <v-icon dark right>
            mdi mdi-pipe
          </v-icon>
        </v-btn>
        <v-btn
          class="ma-2"
          @click="loadPipelinesAction()"
        >
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
        :loading="isLoadingPipelines"
        class="elevation-1"
      >
        <v-progress-linear
          slot="progress"
          indeterminate
        />

        <template v-slot:item.trigger.interval="{ item }">
          {{ getHoursFromMS(item.trigger.interval) }}h:{{ getMinutesFromMS(item.trigger.interval) }}m
        </template>

        <template v-slot:item.trigger.periodic="{ item }">
          <v-switch v-model="item.trigger.periodic" class="ma-2" disabled></v-switch>
        </template>

        <template v-slot:item.action="{ item }">
          <v-btn depressed small @click="onShowPipelineData(item)" class="ma-2">
              Data
              <v-icon dark right >mdi mdi-database</v-icon>
          </v-btn>
          <v-btn depressed small @click="onEditPipeline(item)" class="ma-2">
            Edit
            <v-icon dark right >mdi mdi-pencil</v-icon>
          </v-btn>
          <v-btn depressed small @click="onDeletePipeline(item)" class="ma-2">
            Delete
            <v-icon dark right>mdi mdi-delete</v-icon>
          </v-btn>
          <v-btn depressed small @click="onNotifications(item)" class="ma-2">
            Notifications
            <v-icon dark right>mdi mdi-alarm</v-icon>
          </v-btn>
        </template>

      </v-data-table>
    </v-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { State, Action } from 'vuex-class'
import Pipeline from './pipeline';

const namespace = { namespace: 'pipeline' }

const ONE_HOUR_IN_MS = 3600 * 1000

const ONE_MINUTE_IN_MS = 60 * 1000

@Component({})
export default class PipelineOverview extends Vue {

  @Action('loadPipelines', namespace) private loadPipelinesAction!: () => void;
  @Action('deletePipeline', namespace) private deletePipelineAction!: (id: number) => void;

  @State('isLoadingPipelines', namespace) private isLoadingPipelines!: boolean;
  @State('pipelines', namespace) private pipelines!: object[];

  private headers = [
    { text: 'Id', value: 'id' },
    { text: 'Pipeline Name', value: 'metadata.displayName', sortable: false}, // sorting to be implemented
    { text: 'Author', value: 'metadata.author', sortable: false },
    { text: 'Interval', value: 'trigger.interval', sortable: false},
    { text: 'Periodic', value: 'trigger.periodic', sortable: false},
    { text: 'Action', value: 'action', sortable: false }
  ];

  private search = '';

  private mounted () {
    this.loadPipelinesAction()
  }

  private onShowPipelineData (pipeline: Pipeline) {
    this.$router.push({ name: 'pipeline-storage-overview', params: { storageId: `${pipeline.id}` } })
  }

  private onCreatePipeline () {
    this.$router.push({ name: 'pipeline-new'})
  }

  private onEditPipeline (pipeline: Pipeline) {
    this.$router.push({ name: 'pipeline-edit',  params: { pipelineId: `${pipeline.id}` } })
  }

  private onDeletePipeline (pipeline: Pipeline) {
    this.deletePipelineAction(pipeline.id);
  }

  private onNotifications (pipeline: Pipeline) {
    this.$router.push({ name: 'notification-overview', params: { pipelineId: `${pipeline.id}` } })
  }

  private filterOnlyDisplayName (value: any, search: string, item: Pipeline): boolean {
    return value != null &&
          search != null &&
          typeof value === 'string' &&
          item.metadata.displayName.toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) !== -1
  }

  private getHoursFromMS (intervalInMS: number): number {
    return Math.floor(intervalInMS / ONE_HOUR_IN_MS)
  }

  private getMinutesFromMS (intervalInMS: number): number {
    return Math.floor((intervalInMS % ONE_HOUR_IN_MS ) / ONE_MINUTE_IN_MS )
  }
}
</script>
