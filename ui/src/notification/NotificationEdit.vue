<template>
  <v-card>
    <v-card-title>
      <span class="headline">Update Notification</span>
    </v-card-title>
    <v-card-text>
      <notification-form
        v-if="notification"
        v-model="notification"
        @changeValidity="isValid = $event"
      />
      <v-progress-linear
        v-else
        indeterminate
      />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn
        color="primary"
        class="ma-2"
        :disabled="!isValid"
        @click="onUpdate()"
      >
        Save
      </v-btn>
      <v-btn
        color="error"
        class="ma-2"
        @click="onCancel()"
      >
        Cancel
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import Vue from 'vue'

import NotificationForm from '@/notification/NotificationForm.vue'

import NotificationConfig from '@/notification/notificationConfig'
import * as NotificationREST from '@/notification/notificationRest'

@Component({
  components: { NotificationForm }
})
export default class NotificationEdit extends Vue {
  private isValid = false

  private notification: NotificationConfig | null = null

  private mounted (): void {
    const pipelineId = parseInt(this.$route.params.pipelineId)
    const notificationId = parseInt(this.$route.params.notificationId)
    this.loadNotification(pipelineId, notificationId)
  }

  private async loadNotification (pipelineId: number, notificationId: number): Promise<void> {
    const notificationsOfPipeline = await NotificationREST.getAllByPipelineId(pipelineId)
    this.notification = notificationsOfPipeline.find(x => x.id === notificationId) || null
  }

  private async onUpdate (): Promise<void> {
    if (!this.notification) {
      return
    }

    await NotificationREST.update(this.notification)
    this.$router.push({ name: 'notification-overview' })
  }

  private onCancel (): void {
    this.$router.back()
  }
}

</script>
