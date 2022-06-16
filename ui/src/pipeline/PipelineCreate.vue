<template>
  <div>
    <v-container class="mx-auto">
      <pipeline-form v-model="pipeline" @validityChanged="e => (isValid = e)" />
      <div class="float-right">
        <v-spacer />
        <v-btn color="error" class="ma-2" @click="onCancel">
          Cancel
        </v-btn>
        <v-btn
          :disabled="!isValid"
          color="primary"
          class="ma-2"
          @click="onSave()"
        >
          Save
        </v-btn>
      </div>
    </v-container>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

import PipelineSchemaEdit from './edit/schema/PipelineSchemaEdit.vue';
import PipelineForm from './PipelineForm.vue';
import { PipelineRest } from './pipelineRest';

import { PIPELINE_SERVICE_URL } from '@/env';
import Pipeline from '@/pipeline/pipeline';

const PipelineREST = new PipelineRest(PIPELINE_SERVICE_URL);

@Component({
  components: {
    PipelineSchemaEdit,
    PipelineForm,
  },
})
export default class PipelineCreate extends Vue {
  private pipeline: Pipeline = {
    id: -1,
    datasourceId: -1,
    metadata: {
      displayName: '',
      description: '',
      author: '',
      license: '',
    },
    transformation: { func: "data.test = 'abc';\nreturn data;" },
  };
  private isValid = false;

  private async onSave(): Promise<void> {
    try {
      await PipelineREST.createPipeline(this.pipeline);
      this.routeToOverview();
    } catch (error) {
      console.error('Failed to create datasource', error);
    }
  }

  private onCancel(): void {
    this.routeToOverview();
  }

  private routeToOverview(): void {
    this.$router
      .push({ name: 'pipeline-overview' })
      .catch(error =>
        console.log('Failed to route to pipeline-overview', error),
      );
  }
}
</script>
