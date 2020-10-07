<template>
  <div>
    Hello
    <v-card>
      <v-card-title>
        <v-btn
          class="ma-2"
          color="success"
          @click="onCreateAPIConfig()"
        >
          Create new API Configuration
          <v-icon
            dark
            right
          >
            mdi mdi-pipe
          </v-icon>
        </v-btn>
        <v-btn
          class="ma-2"
          @click="loadAPIConfigsAction()"
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
        :items="apiConfigs"
        :search="search"
        :custom-filter="filterOnlyDisplayName"
        :loading="isLoadingAPIConfigs"
        class="elevation-1"
      >
        <v-progress-linear
          slot="progress"
          indeterminate
        />

        <template v-slot:item.remoteSchemata="{ items }">
          <div>
<!--            {{ JSON.stringify(item) }}-->
            <ul>
              <li v-for="item in items">{{ item.endpoint }}</li>
<!--              <li v-for="(x, index) in items" :key="`x-${index}`">{{x.endpoint}}</li>-->
            </ul>
<!--            <v-list>-->
<!--              <v-list-item-->
<!--                v-for="x in items"-->
<!--                v-bind:key="x.id"-->
<!--              >-->
<!--                {{ x.endpoint }}-->
<!--              </v-list-item>-->
<!--            </v-list>-->
          </div>
        </template>

        <template v-slot:item.action="{ item }">
          <v-btn
            depressed
            small
            class="ma-2"
            @click="onEditAPIConfig(item)"
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
            @click="onDeleteAPIConfig(item)"
          >
            Delete
            <v-icon
              dark
              right
            >
              mdi mdi-delete
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
import { State, Action } from 'vuex-class'
import APIConfig from './api'

const namespace = { namespace: 'apiConfig' }

@Component({})
export default class APIConfigOverview extends Vue {
  @Action('loadAPIConfigs', namespace) private loadAPIConfigsAction!: () => void;
  @Action('deleteAPIConfig', namespace) private deleteAPIConfigAction!: (id: number) => void;

  @State('isLoadingAPIConfigs', namespace) private isLoadingAPIConfigs!: boolean;
  @State('apiConfigs', namespace) private apiConfigs!: object[];

  private headers = [
    { text: 'Id', value: 'id' },
    { text: 'Display Name', value: 'displayName' },
    { text: 'Pipeline ID', value: 'pipelineId' },
    { text: 'Default API', value: 'defaultAPI' },
    { text: 'Remote Schemata', value: 'remoteSchemata' },
    { text: 'Action', value: 'action', sortable: false }
  ];

  private search = '';

  private mounted (): void {
    this.loadAPIConfigsAction()
  }

  // private onShowAPIConfigData (apiConfig: APIConfig): void {
  //   this.$router.push({ name: 'pipeline-storage-overview', params: { storageId: `${pipeline.id}` } })
  // }

  private onCreateAPIConfig (): void {
    this.$router.push({ name: 'api-config-new' })
  }

  private onEditAPIConfig (apiConfig: APIConfig): void {
    this.$router.push({ name: 'api-config-edit', params: { apiConfigId: `${apiConfig.id}` } })
  }

  private onDeleteAPIConfig (apiConfig: APIConfig): void {
    this.deleteAPIConfigAction(apiConfig.id)
  }

  private filterOnlyDisplayName (value: object, search: string, item: APIConfig): boolean {
    return value != null &&
      search != null &&
      typeof value === 'string' &&
      item.displayName.toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) !== -1
  }
}
</script>
