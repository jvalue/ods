<template>
  <v-container>
    <v-form v-model="isBaseValid">
      <v-row
        cols="30"
        sm="6"
        md="4"
      >
        <v-select
          v-model="notification.type"
          :items="notificationTypes"
          label="Type"
          @change="resetParameters()"
        />
      </v-row>
      <v-row
        cols="20"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="notification.condition"
          label="Condition"
        />
      </v-row>
    </v-form>
    <v-row
      cols="10"
      sm="6"
      md="4"
    >
      <webhook-notification-form
        v-if="notification.type === 'webhook'"
        v-model="notification.parameters"
        style="flex: 1 1 auto"
        @changeValidity="isParametersValid = $event"
      />
      <firebase-notification-form
        v-if="notification.type === 'fcm'"
        v-model="notification.parameters"
        style="flex: 1 1 auto"
        @changeValidity="isParametersValid = $event"
      />
      <slack-notification-form
        v-if="notification.type === 'slack'"
        v-model="notification.parameters"
        style="flex: 1 1 auto"
        @changeValidity="isParametersValid = $event"
      />
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import Vue from 'vue'

import WebhookNotificationForm from '@/notification/WebhookNotificationForm.vue'
import FirebaseNotificationForm from '@/notification/FirebaseNotificationForm.vue'
import SlackNotificationForm from '@/notification/SlackNotificationForm.vue'

import NotificationConfig, { CONFIG_TYPE } from '@/notification/notificationConfig'
import { Emit, PropSync, Watch } from 'vue-property-decorator'

@Component({
  components: { WebhookNotificationForm, FirebaseNotificationForm, SlackNotificationForm }
})
export default class NotificationForm extends Vue {
  private notificationTypes = Object.values(CONFIG_TYPE) // Convert CONFIG_TYPES to list

  @PropSync('value')
  private notification!: NotificationConfig

  private isBaseValid = false
  private isParametersValid = false
  private get isValid (): boolean {
    return this.isBaseValid && this.isParametersValid
  }

  private mounted (): void {
    this.initialValidityCheck()
  }

  private initialValidityCheck (): void {
    this.emitIsValid()
  }

  @Watch('notification', { deep: true })
  private onChangeNotification (): void {
    this.emitNotification()
  }

  @Emit('value')
  private emitNotification (): NotificationConfig | undefined {
    return this.notification
  }

  @Watch('isValid')
  private onChangeValidity (): void {
    this.emitIsValid()
  }

  @Emit('changeValidity')
  private emitIsValid (): boolean {
    return this.isValid
  }

  private resetParameters (): void {
    this.notification.parameters = {}
    this.isParametersValid = false
  }
}

</script>
