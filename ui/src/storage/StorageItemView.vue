<template>
  <div>
    <div v-if="item !== null">
      <v-card class="grey lighten-3">
        <v-container fluid>
          <pre style="max-height: 400px; overflow:auto; text-align: left">{{
            item.data
          }}</pre>
        </v-container>

        <v-divider />

        <v-list class="grey lighten-3">
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>Static Link</v-list-item-title>
              <v-list-item-subtitle>{{ storageItemUrl }}</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <v-btn icon @click="clipUrl(storageItemUrl)">
                <v-icon color="grey lighten-1">
                  mdi mdi-content-copy
                </v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-card>
    </div>
    <div v-else>
      <v-progress-linear indeterminate />
    </div>
  </div>
</template>

<script lang="ts">
import clipboardCopy from 'clipboard-copy';
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import { STORAGE_SERVICE_URL } from '../env';

import { StorageItem } from './storage-item';
import { StorageRest } from './storageRest';

@Component({})
export default class PipelineStorageOverview extends Vue {
  private item: StorageItem | null = null;

  private clipUrl = clipboardCopy;

  private readonly storageRest = new StorageRest(STORAGE_SERVICE_URL);

  @Prop()
  private readonly pipelineId!: number;

  @Prop()
  private readonly itemId!: number;

  private mounted(): void {
    this.storageRest
      .getStoredItem(this.pipelineId, this.itemId)
      .then(item => (this.item = item))
      .catch(error => console.error('Failed to fetch stored items', error));
  }

  private get storageItemUrl(): string {
    let url = this.storageRest.createUrlForItem(this.pipelineId, this.itemId);
    url = this.ensureOriginUrlPrefix(url);
    return url;
  }

  private get latestStorageItemUrl(): string {
    let url = this.storageRest.createUrlForLatestItem(this.pipelineId);
    url = this.ensureOriginUrlPrefix(url);
    return url;
  }

  private ensureOriginUrlPrefix(url: string): string {
    if (!url.startsWith('/')) {
      return url;
    }

    return window.location.origin + url;
  }
}
</script>
