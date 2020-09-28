<template>
  <div class="datasource">
    <v-card>
      <v-card-title>
        <v-btn
          class="ma-2"
          color="success"
          @click="onCreate()"
        >
          Create new Datasource
          <v-icon
            dark
            right
          >
            mdi mdi-pipe
          </v-icon>
        </v-btn>
        <v-btn
          class="ma-2"
          @click="loadDataSources()"
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
        :items="datasources"
        :search="search"
        :custom-filter="filterOnlyDisplayName"
        :loading="isLoadingDatasources"
        class="elevation-1"
      >
        <v-progress-linear
          slot="progress"
          indeterminate
        />

        <template v-slot:[`item.trigger.interval`]="{ item }">
          {{ getHoursFromMS(item.trigger.interval) }}h:{{ getMinutesFromMS(item.trigger.interval) }}m
        </template>

        <template v-slot:[`item.trigger.periodic`]="{ item }">
          <v-switch
            v-model="item.trigger.periodic"
            class="ma-2"
            disabled
          />
        </template>

        <template v-slot:[`item.action`]="{ item }">
          <v-btn
            depressed
            small
            class="ma-2"
            @click="onEdit(item)"
          >
            Edit
            <v-icon
              dark
              right
            >
              mdi mdi-pencil
            </v-icon>
          </v-btn>
          <v-btn
            depressed
            small
            class="ma-2"
            @click="onDelete(item)"
          >
            Delete
            <v-icon
              dark
              right
            >
              mdi mdi-delete
            </v-icon>
          </v-btn>
          <v-btn
            depressed
            small
            class="ma-2"
            @click="onCreatePipeline(item)"
          >
            Create Pipeline
            <v-icon
              dark
              right
            >
              mdi mdi-pipe
            </v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import Datasource from './datasource'
import * as DatasourceREST from './datasourceRest'

const ONE_HOUR_IN_MS = 3600 * 1000
const ONE_MINUTE_IN_MS = 60 * 1000

@Component({})
export default class DatsourceOverview extends Vue {
  private isLoadingDatasources = false
  private datasources: Datasource[] = []

  private headers = [
    { text: 'Id', value: 'id' },
    { text: 'Datasource Name', value: 'metadata.displayName', sortable: false }, // sorting to be implemented
    { text: 'Author', value: 'metadata.author', sortable: false },
    { text: 'Interval', value: 'trigger.interval', sortable: false },
    { text: 'Periodic', value: 'trigger.periodic', sortable: false },
    { text: 'Action', value: 'action', sortable: false }
  ];

  private search = '';

  private mounted (): void {
    this.loadDataSources()
  }

  private onCreate (): void {
    this.$router.push({ name: 'datasource-new' })
  }

  private onEdit (datasource: Datasource): void {
    this.$router.push({ name: 'datasource-edit', params: { datasourceId: `${datasource.id}` } })
  }

  private async onDelete (datasource: Datasource): Promise<void> {
    await DatasourceREST.deleteDatasource(datasource.id)
  }

  private onCreatePipeline (datasource: Datasource): void {
    this.$router.push({ name: 'pipeline-new', params: { datasourceId: `${datasource.id}` } })
  }

  private filterOnlyDisplayName (value: unknown, search: string, item: Datasource): boolean {
    return value != null &&
          search != null &&
          typeof value === 'string' &&
          item.metadata.displayName.toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) !== -1
  }

  private getHoursFromMS (intervalInMS: number): number {
    return Math.floor(intervalInMS / ONE_HOUR_IN_MS)
  }

  private getMinutesFromMS (intervalInMS: number): number {
    return Math.floor((intervalInMS % ONE_HOUR_IN_MS) / ONE_MINUTE_IN_MS)
  }

  private async loadDataSources (): Promise<void> {
    this.isLoadingDatasources = true
    this.datasources = await DatasourceREST.getAllDatasources()
    this.isLoadingDatasources = false
  }
}
</script>
