<template>
  <div>
    <v-card class="pb-5">
      <v-card-title>
        <div style="width:100%; text-align: center;"><h1>Storage of Pipeline {{ storageId }}</h1></div>
        <div style="display: block; margin-left: auto; margin-right: auto;">
          <span class="mt-3">
            <v-list>
              <v-list-tile>
                <v-list-tile-content>
                  <v-list-tile-title>Static Link (Latest Data)</v-list-tile-title>
                  <v-list-tile-sub-title>{{ getLatestStorageItemUrl(storageId) }}</v-list-tile-sub-title>
                </v-list-tile-content>
                <v-list-tile-action>
                  <v-btn @click="clipUrl(getLatestStorageItemUrl(storageId))" icon>
                    <v-icon color="grey lighten-1">mdi mdi-content-copy</v-icon>
                  </v-btn>
                </v-list-tile-action>
              </v-list-tile>
            </v-list>
          </span>
          <span>
            <v-btn
              @click="fetchData(storageId)"
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
          <v-flex xs12 sm6 offset-sm3>
            <v-expansion-panel>

              <v-expansion-panel-content v-for="entry in data" v-bind:key="entry.id">

                <template v-slot:header>
                  <div primary-title>
                    <div class="headline"># {{ entry.id }}</div>
                    <span class="grey--text">{{ entry.timestamp }}</span>
                  </div>
                </template>

                <v-card class="grey lighten-3">
                  <v-list class="grey lighten-3">
                    <v-list-tile>
                      <v-list-tile-content>
                        <v-list-tile-title>Origin</v-list-tile-title>
                        <v-list-tile-sub-title>{{ entry.origin }}</v-list-tile-sub-title>
                      </v-list-tile-content>
                    </v-list-tile>
                    <v-list-tile>
                      <v-list-tile-content>
                        <v-list-tile-title>License</v-list-tile-title>
                        <v-list-tile-sub-title>{{ entry.license }}</v-list-tile-sub-title>
                      </v-list-tile-content>
                    </v-list-tile>
                  </v-list>

                  <v-divider></v-divider>

                  <v-container fluid>
                    <pre style="max-height: 400px; overflow:auto;">{{ entry.data | pretty }}</pre>
                  </v-container>

                  <v-divider></v-divider>

                  <v-list class="grey lighten-3">
                    <v-list-tile>
                      <v-list-tile-content>
                        <v-list-tile-title>Static Link</v-list-tile-title>
                        <v-list-tile-sub-title>{{ getStorageItemUrl(storageId, entry.id) }}</v-list-tile-sub-title>
                      </v-list-tile-content>
                      <v-list-tile-action>
                        <v-btn @click="clipUrl(getStorageItemUrl(storageId, entry.id))" icon>
                          <v-icon color="grey lighten-1">mdi mdi-content-copy</v-icon>
                        </v-btn>
                      </v-list-tile-action>
                    </v-list-tile>
                  </v-list>
                </v-card>
              </v-expansion-panel-content>
            </v-expansion-panel>
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
import { StorageItem } from './storage-item';

const namespace = { namespace: 'storage' }

@Component
export default class PipelineStorageOverview extends Vue {

  @State('data', namespace)
  private data!: StorageItem[]

  @Action('fetchData', namespace)
  private fetchData!: (pipelineId: string) => void

  private pipelineId: string = ''

  private clipUrl: (content: string) => Promise<void> = clipboardCopy

  private getStorageItemUrl (pipelineId: string, itemId: string): string {
    let url = StorageClient.createUrlForItem(pipelineId, itemId)
    if(url.startsWith('/')) {
      url = window.location.origin + url
    }
    return url
  };

  private getLatestStorageItemUrl (pipelineId: string): string {
    let url = StorageClient.createUrlForLatestItem(pipelineId)
    if(url.startsWith('/')) {
      url = window.location.origin + url
    }
    return url
  }

  private created () {
    this.pipelineId = this.$route.params.storageId
    this.fetchData(this.pipelineId)
  }
}
</script>
