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
                  <v-list-item-title>Static Link (Latest Data)</v-list-item-title>
                  <v-list-item-subtitle>{{ getLatestStorageItemUrl(pipelineId) }}</v-list-item-subtitle>
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
            <v-btn
              @click="fetchData(pipelineId)"
            >
              <v-icon dark>
                mdi mdi-sync
              </v-icon>
            </v-btn>
          </span>
        </div>
      </v-card-title>

      <div class="mt-3">
        <v-layout row>
          <v-flex
            xs12
            sm6
            offset-sm3
          >
            <v-expansion-panels>
              <v-expansion-panel
                v-for="entry in data"
                :key="entry.id"
              >
                <v-expansion-panel-header>
                  <div primary-title>
                    <div class="headline">
                      # {{ entry.id }}
                    </div>
                    <span class="grey--text">{{ entry.timestamp }}</span>
                  </div>
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                  <v-card class="grey lighten-3">
                    <v-list class="grey lighten-3">
                      <v-list-item>
                        <v-list-item-content>
                          <v-list-item-title>Origin</v-list-item-title>
                          <v-list-item-subtitle>{{ entry.origin }}</v-list-item-subtitle>
                        </v-list-item-content>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-content>
                          <v-list-item-title>License</v-list-item-title>
                          <v-list-item-subtitle>{{ entry.license }}</v-list-item-subtitle>
                        </v-list-item-content>
                      </v-list-item>
                    </v-list>

                    <v-divider />

                    <v-container fluid>
                      <pre style="max-height: 400px; overflow:auto; text-align: left">{{ entry.data }}</pre>
                    </v-container>

                    <v-divider />

                    <v-list class="grey lighten-3">
                      <v-list-item>
                        <v-list-item-content>
                          <v-list-item-title>Static Link</v-list-item-title>
                          <v-list-item-subtitle>{{ getStorageItemUrl(pipelineId, entry.id) }}</v-list-item-subtitle>
                        </v-list-item-content>
                        <v-list-item-action>
                          <v-btn
                            icon
                            @click="clipUrl(getStorageItemUrl(pipelineId, entry.id))"
                          >
                            <v-icon color="grey lighten-1">
                              mdi mdi-content-copy
                            </v-icon>
                          </v-btn>
                        </v-list-item-action>
                      </v-list-item>
                    </v-list>
                  </v-card>
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
import Vue from 'vue'
import Component from 'vue-class-component'
import { Action, State } from 'vuex-class'

import clipboardCopy from 'clipboard-copy'

import * as StorageClient from './storageRest'
import { StorageItem } from './storage-item'

const namespace = { namespace: 'storage' }

@Component
export default class PipelineStorageOverview extends Vue {
  @State('data', namespace)
  private data!: StorageItem[]

  @Action('fetchData', namespace)
  private fetchData!: (pipelineId: string) => void

  private pipelineId = ''

  private clipUrl: (content: string) => Promise<void> = clipboardCopy

  private getStorageItemUrl (pipelineId: string, itemId: string): string {
    let url = StorageClient.createUrlForItem(pipelineId, itemId)
    if (url.startsWith('/')) {
      url = window.location.origin + url
    }
    return url
  };

  private getLatestStorageItemUrl (pipelineId: string): string {
    let url = StorageClient.createUrlForLatestItem(pipelineId)
    if (url.startsWith('/')) {
      url = window.location.origin + url
    }
    return url
  }

  private created (): void {
    this.pipelineId = this.$route.params.storageId
    this.fetchData(this.pipelineId)
  }
}
</script>
