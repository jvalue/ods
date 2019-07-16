<template>
  <div class="pipeline">
    <v-card>
      <v-card-title>
        <v-btn
          slot="activator"
          color="success"
          @click="dialog = true"
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
        <v-dialog
          v-model="dialog"
          max-width="500px"
        >
          <v-card>
            <v-card-title primary-title class="headline grey lighten-2">
              <span v-if="dialogPipeline.id == ID_NEW">Create new pipeline</span>
              <span v-else> Update pipeline</span>
            </v-card-title>
            <v-card-text>
              <v-form
                ref="form"
                v-model="valid"
              >
                <v-subheader>Adapter</v-subheader>
                <v-select
                  v-model="dialogPipeline.adapter.protocol"
                  :items="availableAdapterProtocols"
                  label="Protocol"
                  :rules="[required]"
                ></v-select>
                <v-select
                  v-model="dialogPipeline.adapter.format"
                  :items="availableAdapterFormats"
                  label="Format"
                  :rules="[required]"
                ></v-select>
                <v-text-field
                  v-model="dialogPipeline.adapter.location"
                  label="URL"
                  :rules="[required]"
                ></v-text-field>
                
                <v-divider></v-divider>
                <v-subheader>Transformations</v-subheader>
                <v-textarea
                  v-model="dialogPipeline.transformations[0].func"
                  label="Transformation function"
                  rows="3"
                  :rules="[required]"
                />

                <v-divider></v-divider>
                <v-subheader>Metadata</v-subheader>
                <v-text-field
                  v-model="dialogPipeline.metadata.author"
                  label="Author"
                />
                <v-text-field
                  v-model="dialogPipeline.metadata.license"
                  label="License"
                />

                <v-divider></v-divider>
                <v-subheader>Trigger</v-subheader>
                <v-switch 
                  v-model="dialogPipeline.trigger.periodic"
                  label="Periodic execution">
                </v-switch>
                <v-text-field
                  v-model="dialogPipeline.trigger.interval"
                  label="Interval [milliseconds]"
                  type="number"
                  :rules="[required]"
                ></v-text-field>
               
                
              </v-form>
            </v-card-text>
            <v-divider></v-divider>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="error" flat @click="close">Cancel</v-btn>
                  <v-btn :disabled="!valid" v-if="dialogPipeline.id == ID_NEW" color="primary" flat @click="save">Save</v-btn>
                  <v-btn :disabled="!valid" v-else color="primary" flat @click="update">Update</v-btn>
                </v-card-actions>
          </v-card>
        </v-dialog>
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
            {{ props.item.metadata.author }}
          </td>
          <td class="text-xs-left">
            {{ props.item.trigger.firstExecution }}
          </td>
          <td>
            <v-btn depressed small @click="showPipelineData(props.item)">
              Data
              <v-icon dark right >mdi mdi-database</v-icon>
            </v-btn>
            <v-btn depressed small @click="editPipeline(props.item)">
              Edit
              <v-icon dark right >mdi mdi-pencil</v-icon>
            </v-btn>
            <v-btn depressed small @click="deletePipeline(props.item)">
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

@Component
export default class PipelineOverview extends Vue {
  @Action('loadPipelines', namespace) private loadPipelinesAction!: () => void;
  @Action('deletePipeline', namespace) private deletePipelineAction!: (id: string) => void;
  @Action('createPipeline', namespace) private createPipelineAction!: (p: Pipeline) => void;
  @Action('updatePipeline', namespace) private updatePipelineAction!: (p: Pipeline) => void;

  @State('isLoadingPipelines', namespace) private isLoadingPipelines!: boolean;

  @State('pipelines', namespace) private pipelines!: object[];
  
  private ID_NEW = 'new'

  private headers = [
    { text: 'Id', value: 'id' },
    { text: 'Author', value: 'author' },
    { text: 'First Execution', value: 'firstExecution'},
    { text: 'Action', value: 'action' }
  ];

  private dialog = false;

  private valid: boolean = false;

  private availableAdapterProtocols = ['HTTP']
  private availableAdapterFormats = ['JSON', 'XML']
  private defaultTransformationFunc = 'data.test = \'abc\'; return data;'
  private defaultTrigger = {periodic: true, interval: 60000}

  private dialogPipelineDefault: Pipeline = {
    id: this.ID_NEW,
    adapter: {
      protocol: this.availableAdapterProtocols[0],
      format: this.availableAdapterFormats[0],
      location: 'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json'
    },
    transformations: [{func: this.defaultTransformationFunc}],
    metadata: {
      author: '',
      license: ''
    },
    trigger: {
      periodic: true,
      interval: 60000
    }
  };

  private dialogPipeline: Pipeline = JSON.parse(JSON.stringify(this.dialogPipelineDefault))

  private search = '';

  private required (val: string) {
    return !!val || 'required.'
  }

  private mounted () {
    this.loadPipelinesAction()
  }

  private showPipelineData (pipeline: Pipeline) {
    this.$router.push({ name: 'pipeline-storage-overview', params: { storageId: pipeline.id } })
  }

  private editPipeline (pipeline: Pipeline) {
    this.dialogPipeline = JSON.parse(JSON.stringify(pipeline))
    this.dialog = true
  }

  private deletePipeline (pipeline: Pipeline) {
    this.deletePipelineAction(pipeline.id);
  }

  private close () {
    this.dialog = false
    setTimeout(() => {
      this.resetForm()
    }, 300)
  }

  private save () {
    this.createPipelineAction(this.dialogPipeline);
    this.dialog = false
  }

  private update () {
    this.updatePipelineAction(this.dialogPipeline);
    this.dialog = false
  }

  private resetForm () {
    (this.$refs.form as HTMLFormElement).reset()
    this.dialogPipeline = JSON.parse(JSON.stringify(this.dialogPipelineDefault))
  }
}
</script>
