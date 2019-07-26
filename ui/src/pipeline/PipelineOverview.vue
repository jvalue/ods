<template>
  <div class="pipeline">
    <v-card>
      <v-card-title>
        <v-btn
          color="success"
          @click="onCreatePipeline()"
        >
          Create new pipeline
          <v-icon dark right>
            mdi mdi-pipe
          </v-icon>
        </v-btn>
        <v-btn
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
        :custom-filter="filterPipelines"
        :loading="isLoadingPipelines"
        class="elevation-1"
      >
        <v-progress-linear
          slot="progress"
          indeterminate
        />
        <template v-slot:items="props" >
          <td class="text-xs-left">
            {{ props.item.id }}
          </td>
          <td class="text-xs-left">
            {{ props.item.metadata.displayName }}
          </td>
          <td class="text-xs-left">
            {{ props.item.metadata.author }}
          </td>
          <td>
            <v-btn depressed small @click="onShowPipelineData(props.item)">
              Data
              <v-icon dark right >mdi mdi-database</v-icon>
            </v-btn>
            <v-btn depressed small @click="onEditPipeline(props.item)">
              Edit
              <v-icon dark right >mdi mdi-pencil</v-icon>
            </v-btn>
            <v-btn depressed small @click="onDeletePipeline(props.item)">
              Delete
              <v-icon dark right>mdi mdi-delete</v-icon>
            </v-btn>
          </td>
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

@Component({})
export default class PipelineOverview extends Vue {

  @Action('loadPipelines', namespace) private loadPipelinesAction!: () => void;
  @Action('deletePipeline', namespace) private deletePipelineAction!: (id: number) => void;
  
  @State('isLoadingPipelines', namespace) private isLoadingPipelines!: boolean;
  @State('pipelines', namespace) private pipelines!: object[];
  
  private headers = [
    { text: 'Id', value: 'id' },
    { text: 'Pipeline Name', value: 'displayName', sortable: false}, // sorting to be implemented
    { text: 'Author', value: 'author', sortable: false },
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

  private filterPipelines (items: Pipeline[], search: string | null, filter: any) : Pipeline[] {
    const searchTerm = !!search ? search.toLowerCase() : ''
    return items.filter(item => filter(item.metadata.displayName, searchTerm))
  }
}
</script>
