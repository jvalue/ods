<template>
  <div>
    <v-container class="mx-auto">
      <div v-if="pipeline">
        <pipeline-form
          v-model="pipeline"
          @validityChanged="e => (isValid = e)"
        />
        <div class="float-right">
          <v-spacer />
          <v-btn color="error" class="ma-2" @click="onCancel">
            Cancel
          </v-btn>
          <v-btn
            :disabled="!isValid"
            color="primary"
            class="ma-2"
            @click="onEdit()"
          >
            Update
          </v-btn>
        </div>
      </div>
    </v-container>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

import PipelineForm from './PipelineForm.vue';
import { PipelineREST } from './pipelineRest';

import Pipeline from '@/pipeline/pipeline';

@Component({
  components: { PipelineForm },
})
export default class PipelineEdit extends Vue {
  private pipeline: Pipeline | null = null;
  private isValid = false;

  async mounted(): Promise<void> {
    const id = Number.parseInt(this.$route.params.pipelineId, 10);
    await this.loadPipelineById(id);
  }

  private async loadPipelineById(id: number): Promise<void> {
    try {
      this.pipeline = await PipelineREST.getPipelineById(id);
    } catch (error) {
      console.error('Failed to load pipeline', error);
    }
  }

  private async onEdit(): Promise<void> {
    if (this.pipeline == null) {
      return;
    }

    await PipelineREST.updatePipeline(this.pipeline);
    this.routeToOverview();
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
