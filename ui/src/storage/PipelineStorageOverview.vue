<template>
  <div>
    <v-card class="pb-5">
      <v-card-title>
        <div style="width:100%; text-align: center;">
          <h1>Storage of Pipeline {{ pipelineId }}</h1>
        </div>
        <div style="display: block; margin-left: auto; margin-right: auto;">
          <span class="mt-3">
            <v-list>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title
                    >Static Link (Latest Data)</v-list-item-title
                  >
                  <v-list-item-subtitle>{{
                    getLatestStorageItemUrl(pipelineId)
                  }}</v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                  <v-btn
                    icon
                    @click="clipUrl(getLatestStorageItemUrl(pipelineId))"
                  >
                    <v-icon color="grey lighten-1">mdi mdi-content-copy</v-icon>
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </span>
          <span>
            <v-btn @click="fetchData(pipelineId)">
              <v-icon dark>
                mdi mdi-sync
              </v-icon>
            </v-btn>
          </span>
        </div>
      </v-card-title>

      <div class="mt-3">
        <v-layout row>
          <v-flex xs12 sm6 offset-sm3>
            <v-expansion-panels>
              <v-expansion-panel v-for="entry in data" :key="entry.id">
                <v-expansion-panel-header>
                  <div primary-title>
                    <div class="headline"># {{ entry.id }}</div>
                    <span class="grey--text">{{ entry.timestamp }}</span>
                  </div>
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                  <storage-item-view
                    :pipeline-id="entry.pipelineId"
                    :item-id="entry.id"
                  />
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-flex>
        </v-layout>
      </div>
    </v-card>
  </div>
</template>

<script lang="ts">
import clipboardCopy from 'clipboard-copy';
import Vue from 'vue';
import Component from 'vue-class-component';

import { STORAGE_SERVICE_URL } from '../env';

import { StorageItemMetaData } from './storage-item';
import StorageItemView from './StorageItemView.vue';
import { StorageRest } from './storageRest';

@Component({
  components: { StorageItemView },
})
export default class PipelineStorageOverview extends Vue {
  private data: StorageItemMetaData[] = [];

  private pipelineId = 0;

  private clipUrl = clipboardCopy;

  private readonly storageRest = new StorageRest(STORAGE_SERVICE_URL);

  private getStorageItemUrl(pipelineId: number, itemId: number): string {
    let url = this.storageRest.createUrlForItem(pipelineId, itemId);
    if (url.startsWith('/')) {
      url = window.location.origin + url;
    }
    return url;
  }

  private getLatestStorageItemUrl(pipelineId: number): string {
    let url = this.storageRest.createUrlForLatestItem(pipelineId);
    if (url.startsWith('/')) {
      url = window.location.origin + url;
    }
    return url;
  }

  private async created(): Promise<void> {
    this.pipelineId = Number.parseInt(this.$route.params.storageId, 10);
    await this.fetchData(this.pipelineId);
  }

  private async fetchData(pipelineId: number): Promise<void> {
    this.data = await this.storageRest.getStoredItems(pipelineId);
  }
}
</script>
