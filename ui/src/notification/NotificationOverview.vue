<template>
  <div class="notification">
    <v-card>
      <v-card-title>
        <v-btn
          class="ma-2"
          @click="onNavigateBack()"
        >
          <v-icon
            dark
            right
          >
            mdi mdi-arrow-left
          </v-icon>
        </v-btn>
        <v-btn
          class="ma-2"
          color="success"
          @click="onCreateNotification()"
        >
          Add notification
          <v-icon
            dark
            right
          >
            mdi mdi-alarm
          </v-icon>
        </v-btn>
        <v-btn
          class="ma-2"
          @click="loadNotifications()"
        >
          <v-icon dark>
            mdi mdi-sync
          </v-icon>
        </v-btn>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="notifications"
        :loading="isLoading"
        class="elevation-1"
      >
        <v-progress-linear
          slot="progress"
          indeterminate
        />
        <template #[`item.id`]="{ item }">
          {{ item.id }}
        </template>
        <template #[`item.type`]="{ item }">
          {{ item.type }}
        </template>
        <template #[`item.condition`]="{ item }">
          {{ item.condition }}
        </template>
        <template #[`item.action`]="{ item }">
          <v-btn
            depressed
            small
            class="ma-2"
            @click="onEditNotification(item.id)"
          >
            Edit
            <v-icon
              dark
              right
            >
              mdi-pencil
            </v-icon>
          </v-btn>
          <v-btn
            depressed
            small
            class="ma-2"
            @click="onDeleteNotification(item)"
          >
            Delete
            <v-icon
              dark
              right
            >
              mdi-delete
            </v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import Vue from 'vue'

import NotificationConfig from '@/notification/notificationConfig'
import * as NotificaitonREST from './notificationRest'

@Component({})
export default class PipelineNotifications extends Vue {
  headers = [
    { text: 'Id', value: 'id' },
    { text: 'Type', value: 'type' },
    { text: 'Condition', value: 'condition' },
    { text: 'Actions', value: 'action' }
  ]

  private pipelineId = -1
  private notifications: NotificationConfig[] = []
  private isLoading = false

  mounted (): void {
    this.pipelineId = parseInt(this.$route.params.pipelineId)
    this.loadNotifications()
  }

  private onCreateNotification (): void {
    this.$router.push({ name: 'notification-create', params: { pipelineId: `${this.pipelineId}` } })
  }

  private onEditNotification (notificationId: string): void {
    this.$router.push({
      name: 'notification-edit',
      params: { pipelineId: `${this.pipelineId}`, notificationId: `${notificationId}` }
    })
  }

  private async onDeleteNotification (notification: NotificationConfig): Promise<void> {
    await NotificaitonREST.remove(notification)
    await this.loadNotifications()
  }

  private async loadNotifications (): Promise<void> {
    this.isLoading = true
    this.notifications = await NotificaitonREST.getAllByPipelineId(this.pipelineId)
    this.isLoading = false
  }

  private onNavigateBack (): void {
    this.$router.push({ name: 'pipeline-overview' })
  }
}
</script>
