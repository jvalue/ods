<template>
  <v-form
    v-model="validForm"
  >
    <v-text-field
      v-model="slackNotification.workspaceId"
      label="Id of your slack workspace"
      :rules="[ required ]"
      @keyup="formChanged"
    />
    <v-text-field
      v-model="slackNotification.channelId"
      label="Id of the channel"
      :rules="[ required ]"
      @keyup="formChanged"
    />
    <v-text-field
      v-model="slackNotification.secret"
      label="Incoming webhook secret"
      :rules="[ required ]"
      @keyup="formChanged"
    />
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Emit, PropSync } from 'vue-property-decorator'

import { SlackNotification } from '@/notification/notificationConfig'

@Component({ })
export default class SlackEdit extends Vue {
  private validForm = false

  @PropSync('value')
  private slackNotification!: SlackNotification

  @Emit('value')
  emitValue () {
    return this.slackNotification
  }

  @Emit('validityChanged')
  emitValid () {
    return this.validForm
  }

  formChanged () {
    this.emitValue()
    this.emitValid()
  }

  private required (val: string) {
    return !!val || 'required.'
  }
}
</script>
