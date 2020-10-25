<template>
  <v-card>
    <v-card-title>
      <span class="headline">Create Notification</span>
    </v-card-title>
    <v-card-text>
      <notification-form
        v-model="notification"
        @changeValidity="isValid = $event"
      />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn
        color="primary"
        class="ma-2"
        :disabled="!isValid"
        @click="onCreate()"
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

import NotificationConfig, { NotificationType } from '@/notification/notificationConfig'
import * as NotificationREST from '@/notification/notificationRest'

@Component({
  components: { NotificationForm }
})
export default class NotificationCreate extends Vue {
  private isValid = false

  private notification: NotificationConfig = {
    id: -1,
    pipelineId: -1,
    condition: 'true',
    type: NotificationType.WEBHOOK,
    parameters: {}
  }

  private mounted (): void {
    this.notification.pipelineId = parseInt(this.$route.params.pipelineId)
  }

  private async onCreate (): Promise<void> {
    await NotificationREST.create(this.notification)
    this.$router.push({ name: 'notification-overview' })
      .catch(error => console.log('Failed to route to notification-overview', error))
  }

  private onCancel (): void {
    this.$router.back()
  }
}

</script>
