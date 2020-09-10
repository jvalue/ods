<template>
  <div class="pipeline">
    <template>
      <v-form
        v-model="validForm"
      >
        <v-text-field
          v-model="remoteSchemaInput.id"
          type="number"
          label="ID"
          @keyup="formChanged"
        />
        <v-text-field
          v-model="remoteSchemaInput.author"
          label="Remote Schema Author"
          @keyup="formChanged"
        />
        <v-text-field
          v-model="remoteSchemaInput.endpoint"
          label="Remote Schema endpoint"
          @keyup="formChanged"
        />
      </v-form>
    </template>
    <v-card>
      <v-card-title>
        <v-btn
          class="ma-2"
          color="success"
          @click="onCreateEndpoint"
        >
          Add new Endpoint
          <v-icon
            dark
            right
          >
            mdi mdi-pipe
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
        :items="remoteSchemata"
        class="elevation-1"
      >
        <v-progress-linear
          slot="progress"
          indeterminate
        />

        <template v-slot:item.action="{ item }">
          <v-btn
            depressed
            small
            class="ma-2"
            @click="onEditRemoteSchema(item)"
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
            @click="onDeleteRemoteSchema(item)"
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
import Pipeline, { PipelineMetaData, RemoteSchemaData } from './pipeline'
import { Emit, PropSync } from 'vue-property-decorator'

const namespace = { namespace: 'endpoints' }

@Component({})
export default class PipelineOverview extends Vue {
  @Action('loadPipelines', namespace) private loadPipelinesAction!: () => void;
  @Action('deletePipeline', namespace) private deletePipelineAction!: (id: number) => void;

  @State('isLoadingPipelines', namespace) private isLoadingPipelines!: boolean;
  @State('pipelines', namespace) private pipelines!: Pipeline[];
  @State('endpoints', namespace) private endpoints!: RemoteSchemaData[];

  private validForm = true;

  @PropSync('value')
  private metadataConfig!: PipelineMetaData;

  @PropSync('value')
  private remoteSchemata!: RemoteSchemaData[];

  private remoteSchemaInput: RemoteSchemaData = {
    // id: this.findFreeId(this.remoteSchemata),
    id: 3,
    endpoint: 'sdsdf',
    author: 'maltsdfe'
  };

  @Emit('value')
  emitValue (): RemoteSchemaData[] {
    return this.remoteSchemata
  }

  @Emit('validityChanged')
  emitValid (): boolean {
    return this.validForm
  }

  formChanged (): void {
    // this.remoteSchemata.push(this.remoteSchemaInput)
    // this.emitValue()
    // this.emitValid()
  }

  private headers = [
    { text: 'Id', value: 'id' },
    { text: 'Endpoint', value: 'endpoint', sortable: false },
    { text: 'Author', value: 'author', sortable: false },
    { text: 'Action', value: 'action', sortable: false }
  ];

  private onCreateEndpoint (): void {
    const foundIndex = this.remoteSchemata.findIndex(x => x.id === this.remoteSchemaInput.id)
    if (foundIndex !== -1) {
      console.log('onCreate - id exists')
      this.remoteSchemata[foundIndex] = JSON.parse(JSON.stringify(this.remoteSchemaInput))
    } else {
      console.log('onCreate - id doesnt exists')
      this.remoteSchemata.push(JSON.parse(JSON.stringify(this.remoteSchemaInput)))
    }
    this.emitValue()
    this.emitValid()
    this.remoteSchemaInput = {
      // id: this.findFreeId(this.remoteSchemata),
      id: this.remoteSchemaInput.id += 1,
      endpoint: 'new',
      author: 'new'
    }
  }

  private onEditRemoteSchema (remoteSchema: RemoteSchemaData): void {
    // this.remoteSchemata.push(this.remoteSchemaInput)
    // const foundIndex = this.remoteSchemata.findIndex(x => x.id === this.remoteSchemaInput.id)
    // if (foundIndex !== -1) {
    //   this.remoteSchemata[foundIndex] = this.remoteSchemaInput
    //   this.emitValue()
    //   this.emitValid()
    // }
  }

  private onDeleteRemoteSchema (remoteSchema: RemoteSchemaData): void {
    // this.deletePipelineAction(pipeline.id)
  }

  private findFreeId (array: RemoteSchemaData[]) {
    const sortedArray = array
      .slice() // Make a copy of the array.
      .sort(function (a, b) { return a.id - b.id }) // Sort it.
    let previousId = 0
    for (const element of sortedArray) {
      if (element.id !== (previousId + 1)) {
        // Found a gap.
        return previousId + 1
      }
      previousId = element.id
    }
    // Found no gaps.
    return previousId + 1
  }
}
</script>
