<template>
  <div>
    <div v-if="item !== null">
      <v-card class="grey lighten-3">
        <v-container fluid>
          <pre style="max-height: 400px; overflow:auto; text-align: left">{{ item.data }}</pre>
        </v-container>

        <v-divider />

        <v-list class="grey lighten-3">
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>Static Link</v-list-item-title>
              <v-list-item-subtitle>{{ storageItemUrl }}</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <v-btn
                icon
                @click="clipUrl(storageItemUrl)"
              >
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
      <v-progress-linear
        indeterminate
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import clipboardCopy from 'clipboard-copy'

import { StorageItem } from './storage-item'
import * as StorageREST from './storageRest'

@Component({})
export default class PipelineStorageOverview extends Vue {
  private item: StorageItem | null = null

  private clipUrl = clipboardCopy

  @Prop()
  private readonly pipelineId!: number

  @Prop()
  private readonly itemId!: number

  private mounted (): void {
    this.fetchData()
  }

  private get storageItemUrl (): string {
    let url = StorageREST.createUrlForItem(this.pipelineId, this.itemId)
    url = this.ensureOriginUrlPrefix(url)
    return url
  };

  private get latestStorageItemUrl (): string {
    let url = StorageREST.createUrlForLatestItem(this.pipelineId)
    url = this.ensureOriginUrlPrefix(url)
    return url
  }

  private ensureOriginUrlPrefix (url: string): string {
    if (!url.startsWith('/')) {
      return url
    }

    return window.location.origin + url
  }

  private async fetchData (): Promise<void> {
    this.item = await StorageREST.getStoredItem(this.pipelineId, this.itemId)
  }
}
</script>
